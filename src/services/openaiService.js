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
 * Error backoff state to track API errors and implement circuit breaking
 * @type {Object}
 */
const errorBackoff = {
    consecutiveErrors: 0,
    lastErrorTime: 0,
    isInCooldown: false
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
    errorBackoff.isInCooldown = false;
};

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

            const response = await fetch('/api/openai', {
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

                // Check specifically for quota errors (no retry)
                const isQuotaExceeded =
                    response.status === 429 ||
                    errorMessage.includes('quota') ||
                    errorMessage.includes('rate limit') ||
                    errorMessage.includes('billing');

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
            if (errorBackoff.consecutiveErrors > 0) {
                errorBackoff.consecutiveErrors = 0; // Reset counter on success
            }

            return response;
        } catch (error) {
            lastError = error;

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
    if (errorBackoff.consecutiveErrors >= 3) {
        console.warn('Multiple consecutive API errors detected, entering cooldown period');
        errorBackoff.isInCooldown = true;
        apiAvailable = false;

        // Auto-reset after cooldown period
        setTimeout(() => {
            console.log('Cooldown period complete, resetting API availability');
            errorBackoff.isInCooldown = false;
            errorBackoff.consecutiveErrors = 0;
            apiAvailable = true;
        }, 30000); // 30 second cooldown
    }
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
        throw error;
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
            title: data.title || plotElements.title || "Untitled Action",
            plot: data.plot || ""
        };
    } catch (error) {
        console.error('Error calling generateMoviePlot:', error);
        throw error;
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
        return data.trailer || "";
    } catch (error) {
        console.error('Error calling generateMovieTrailer:', error);
        throw error;
    }
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
    generateTrailerAudio,
    generateMultipleMovies
};
