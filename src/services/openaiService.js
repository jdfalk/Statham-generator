/**
 * Flag indicating whether API functionality is available
 * @type {boolean}
 */
let apiAvailable = true;

/**
 * Maximum number of retries for API calls
 * @type {number}
 */
const MAX_RETRIES = 2;

/**
 * Delay between retries in milliseconds (exponential backoff)
 * @type {number}
 */
const INITIAL_RETRY_DELAY = 1000;

/**
 * Client-side timeout for fetch requests in milliseconds
 * @type {number}
 */
const FETCH_TIMEOUT = 30000; // 30 seconds

/**
 * Error backoff state to track API errors and implement circuit breaking
 * @type {Object}
 */
const errorBackoff = {
    consecutiveErrors: 0,
    lastErrorTime: 0,
    isInCooldown: false,
    timeoutCount: 0
};

/**
 * Initialize the OpenAI service
 * @returns {boolean} - Whether initialization was successful
 */
export const initializeOpenAI = () => {
    // We always return true because the API key is handled server-side
    return true;
};

/**
 * Check if OpenAI service is initialized
 * @returns {boolean} - Whether OpenAI service is initialized
 */
export const isOpenAIInitialized = () => {
    // If we're in an error cooldown period, return false
    if (errorBackoff.isInCooldown) {
        // Check if cooldown period has expired
        const now = Date.now();
        const cooldownTime = 30000; // 30 seconds
        if (now - errorBackoff.lastErrorTime > cooldownTime) {
            console.log('Error cooldown period expired, resetting availability');
            errorBackoff.isInCooldown = false;
            errorBackoff.consecutiveErrors = 0;
            errorBackoff.timeoutCount = 0;
            return true;
        }
        return false;
    }
    return apiAvailable;
};

/**
 * Reset API availability flag
 */
export const clearOpenAI = () => {
    apiAvailable = true;
    errorBackoff.consecutiveErrors = 0;
    errorBackoff.timeoutCount = 0;
    errorBackoff.isInCooldown = false;
};

/**
 * Fetch with timeout to prevent hanging requests
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} - The fetch response
 */
async function fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const signal = controller.signal;

    const timeoutId = setTimeout(() => {
        controller.abort();
    }, FETCH_TIMEOUT);

    try {
        const response = await fetch(url, {
            ...options,
            signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            const timeoutError = new Error('Request timed out');
            timeoutError.isTimeout = true;
            throw timeoutError;
        }
        throw error;
    }
}

/**
 * Generic fetch function with retry logic
 * @param {string} action - The API action to perform
 * @param {Object} payload - The data to send to the API
 * @returns {Promise<any>} - The API response
 * @throws {Error} - Throws if all retries fail
 */
async function fetchWithRetry(action, payload) {
    // If we're in cooldown period, immediately fail
    if (errorBackoff.isInCooldown) {
        throw new Error('API temporarily unavailable due to previous errors. Please try again later.');
    }

    let lastError;
    let delay = INITIAL_RETRY_DELAY;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            // Add some jitter to avoid all retries happening simultaneously
            if (attempt > 0) {
                const jitter = Math.random() * 500;
                await new Promise(resolve => setTimeout(resolve, delay + jitter));
                delay *= 2; // Exponential backoff
            }

            const response = await fetchWithTimeout('/api/openai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action,
                    ...payload
                }),
            });

            // Check for error response
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.message || errorData.error || `HTTP error: ${response.status}`;

                // Identify the type of error based on status code and message
                const isTimeout = response.status === 504 ||
                    (errorData.errorType === 'timeout') ||
                    errorMessage.includes('timeout') ||
                    errorMessage.includes('timed out');

                const isQuotaExceeded = response.status === 429 ||
                    (errorData.errorType === 'rate_limit') ||
                    errorMessage.includes('quota') ||
                    errorMessage.includes('rate limit') ||
                    errorMessage.includes('billing');

                // Handle timeouts with special treatment
                if (isTimeout) {
                    errorBackoff.timeoutCount++;
                    console.warn(`Timeout detected (count: ${errorBackoff.timeoutCount})`);

                    // If we've seen multiple timeouts, enter a cooldown period
                    if (errorBackoff.timeoutCount >= 2) {
                        console.warn('Multiple timeouts detected, entering cooldown period');
                        errorBackoff.isInCooldown = true;
                        errorBackoff.lastErrorTime = Date.now();
                        apiAvailable = false;
                        throw new Error('OpenAI API is timing out repeatedly. Try again with a simpler request or after some time has passed.');
                    }

                    // For a single timeout, retry with a longer delay
                    if (attempt < MAX_RETRIES) {
                        console.warn(`Timeout error (attempt ${attempt + 1}/${MAX_RETRIES + 1}). Retrying with longer delay...`);
                        await new Promise(resolve => setTimeout(resolve, 3000)); // Longer delay for timeouts
                        continue;
                    }
                }

                if (isQuotaExceeded) {
                    console.error('API quota exceeded:', errorMessage);
                    // Mark the service as unavailable
                    apiAvailable = false;
                    errorBackoff.isInCooldown = true;
                    errorBackoff.lastErrorTime = Date.now();
                    throw new Error(`OpenAI API quota exceeded. Please check your billing details: ${errorMessage}`);
                }

                // If the server says we should retry, do so unless we've hit max retries
                if ((errorData.retry || response.status >= 500) && attempt < MAX_RETRIES) {
                    console.warn(`API error (attempt ${attempt + 1}/${MAX_RETRIES + 1}): ${errorMessage}. Retrying...`);
                    lastError = new Error(errorMessage);
                    continue;
                }

                throw new Error(errorMessage);
            }

            // Success - reset error counter and return data
            if (errorBackoff.consecutiveErrors > 0 || errorBackoff.timeoutCount > 0) {
                errorBackoff.consecutiveErrors = 0; // Reset counter on success
                errorBackoff.timeoutCount = 0;      // Reset timeout counter on success
            }

            return response;
        } catch (error) {
            lastError = error;

            // Handle client-side timeout (AbortController)
            if (error.isTimeout) {
                errorBackoff.timeoutCount++;
                console.warn(`Client-side timeout detected (count: ${errorBackoff.timeoutCount})`);

                if (errorBackoff.timeoutCount >= 2) {
                    console.warn('Multiple client-side timeouts detected, entering cooldown period');
                    errorBackoff.isInCooldown = true;
                    errorBackoff.lastErrorTime = Date.now();
                    apiAvailable = false;
                    throw new Error('Requests to the server are timing out. Please try again later.');
                }

                if (attempt < MAX_RETRIES) {
                    continue; // Retry for client-side timeout
                }
            }

            // If this is a quota error, don't retry
            if (error.message && (
                error.message.includes('quota') ||
                error.message.includes('billing') ||
                error.message.includes('rate limit')
            )) {
                throw error;
            }

            // Only increment error counter on the last attempt
            if (attempt === MAX_RETRIES) {
                handleApiError();
            }
        }
    }

    throw lastError;
}

/**
 * Handle API errors and implement circuit breaking
 */
function handleApiError() {
    errorBackoff.consecutiveErrors++;
    errorBackoff.lastErrorTime = Date.now();

    // If we've had several consecutive errors, enter cooldown mode
    if (errorBackoff.consecutiveErrors >= 3 || errorBackoff.timeoutCount >= 2) {
        console.warn('Multiple consecutive API errors detected, entering cooldown period');
        errorBackoff.isInCooldown = true;
        apiAvailable = false;

        // Auto-reset after cooldown period
        setTimeout(() => {
            console.log('Cooldown period complete, resetting API availability');
            errorBackoff.isInCooldown = false;
            errorBackoff.consecutiveErrors = 0;
            errorBackoff.timeoutCount = 0;
            apiAvailable = true;
        }, 30000); // 30 second cooldown
    }
}

/**
 * Generate a random Statham movie title as a fallback
 * @returns {string} - A random movie title
 */
function generateFallbackTitle() {
    const prefixes = ['Steel', 'Iron', 'Blood', 'Death', 'Night', 'Fury', 'Shadow', 'Chrome', 'Brutal', 'Lethal'];
    const suffixes = ['Protocol', 'Justice', 'Vengeance', 'Redemption', 'Command', 'Strike', 'Execution', 'Hunter', 'Code', 'Force'];

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

    return `${prefix} ${suffix}`;
}

/**
 * Generates a title for a movie based on provided plot elements
 *
 * @param {Object} plotElements - Elements of the plot to use for title generation
 * @returns {Promise<string>} - The generated title
 */
export async function generateTitle(plotElements) {
    try {
        const response = await fetchWithRetry('generateTitle', { plotElements });
        const data = await response.json();
        return data.title || "Untitled Action";
    } catch (error) {
        console.error('Error calling generateTitle:', error);
        // Use fallback title generator on failure
        return generateFallbackTitle();
    }
}

/**
 * Generates a movie plot based on provided plot elements
 *
 * @param {Object} plotElements - Elements to include in the plot
 * @returns {Promise<Object>} - The generated plot with title
 */
export async function generateMoviePlot(plotElements) {
    try {
        const response = await fetchWithRetry('generateMoviePlot', { plotElements });
        const data = await response.json();
        return {
            title: data.title || plotElements.title || generateFallbackTitle(),
            plot: data.plot || ""
        };
    } catch (error) {
        console.error('Error calling generateMoviePlot:', error);

        // Return fallback plot with original elements
        return {
            title: plotElements.title || generateFallbackTitle(),
            plot: `In this action-packed thriller, Jason Statham plays a former ${plotElements.formerProfession} who now works as a ${plotElements.currentJob}. But when ${plotElements.plotTrigger}, he's forced back into action. With the help of ${plotElements.sidekick}, he takes on ${plotElements.villain} and ${plotElements.villainGroup} in ${plotElements.setting}. Armed with ${plotElements.weapon} and driving ${plotElements.vehicle}, Statham is unstoppable. In a shocking twist, ${plotElements.plotTwist}, leading to ${plotElements.bossFight} where the villain is ${plotElements.bossKill}.`
        };
    }
}

/**
 * Generates a movie trailer script based on provided plot elements
 *
 * @param {Object} plotElements - Elements to include in the trailer
 * @returns {Promise<string>} - The generated trailer script
 */
export async function generateMovieTrailer(plotElements) {
    try {
        const response = await fetchWithRetry('generateMovieTrailer', { plotElements });
        const data = await response.json();
        return data.trailer || generateFallbackTrailer(plotElements);
    } catch (error) {
        console.error('Error calling generateMovieTrailer:', error);
        return generateFallbackTrailer(plotElements);
    }
}

/**
 * Generate a fallback trailer when API fails
 * @param {Object} plotElements - Plot elements to include in the trailer
 * @returns {string} - A fallback trailer script
 */
function generateFallbackTrailer(plotElements) {
    return `
[DEEP VOICE]

In a world where danger lurks around every corner...

[PAUSE]

One man stands between chaos and order.

[TENSION BUILDING MUSIC]

Jason Statham is a former ${plotElements.formerProfession}...

"I thought I left that life behind."

Now working as a ${plotElements.currentJob}, until...

[DRAMATIC SOUND EFFECT]

${plotElements.plotTrigger.charAt(0).toUpperCase() + plotElements.plotTrigger.slice(1)}.

[QUICK CUTS OF ACTION]

"They've taken EVERYTHING from me. Now I'll take EVERYTHING from them."

[MUSIC INTENSIFIES]

In ${plotElements.setting}, he'll confront ${plotElements.villain}...

"Did you really think you could escape your past?"

...and take down ${plotElements.villainGroup}.

[EXPLOSION SOUND]

${plotElements.title.toUpperCase()}

Vengeance has a name.

[IN THEATERS THIS SUMMER]
`;
}

/**
 * Generates a movie poster description based on the plot and style
 *
 * @param {Object} plot - The plot elements
 * @param {string} style - Poster style (action, artsy, vintage)
 * @returns {Promise<string>} - The generated poster description
 */
export async function generatePosterDescription(plot, style) {
    try {
        const response = await fetchWithRetry('generatePosterDescription', { plot, style });
        const data = await response.json();
        return data.description || "";
    } catch (error) {
        console.error('Error calling generatePosterDescription:', error);
        throw error;
    }
}

/**
 * Generates a movie poster using OpenAI's SORA API
 *
 * @param {Object} plot - The plot elements
 * @param {string} style - Poster style (action, artsy, vintage)
 * @returns {Promise<string>} - URL to the generated poster image
 */
export async function generateMoviePoster(plot, style) {
    try {
        const response = await fetchWithRetry('generateMoviePoster', { plot, style });
        const data = await response.json();
        return data.imageUrl || "";
    } catch (error) {
        console.error('Error calling generateMoviePoster:', error);
        throw error;
    }
}

/**
 * Generates audio for a movie trailer
 *
 * @param {string} trailerText - Text of the trailer to convert to audio
 * @returns {Promise<string>} - URL to the generated audio file
 */
export async function generateTrailerAudio(trailerText) {
    try {
        // Audio is different because it returns binary data
        const response = await fetchWithRetry('generateTrailerAudio', { trailerText });

        // Check if the response is JSON (error) or blob (success)
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            if (data.audio) {
                // Handle base64 encoded audio
                const byteCharacters = atob(data.audio);
                const byteNumbers = new Array(byteCharacters.length);

                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }

                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'audio/mpeg' });
                return URL.createObjectURL(blob);
            }
            throw new Error(data.error || 'Failed to generate audio');
        }

        // Handle binary response
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error('Error calling generateTrailerAudio:', error);
        throw error;
    }
}

/**
 * Generate multiple movie plots for studio mode
 * @param {number} count - Number of movies to generate
 * @returns {Promise<Array>} - Array of generated movies
 */
export const generateMultipleMovies = async (count) => {
    try {
        const response = await fetchWithRetry('generateMultipleMovies', { count });
        const data = await response.json();
        return data.movies || [];
    } catch (error) {
        console.error('Error calling generateMultipleMovies:', error);
        throw error;
    }
};

export default {
    initializeOpenAI,
    isOpenAIInitialized,
    clearOpenAI,
    generateTitle,
    generateMoviePlot,
    generateMovieTrailer,
    generatePosterDescription,
    generateMoviePoster,
    generateTrailerAudio,
    generateMultipleMovies
};
