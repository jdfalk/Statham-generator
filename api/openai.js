// file: api/openai.js
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Maximum number of retries for API calls
 * @type {number}
 */
const MAX_RETRIES = 3;

/**
 * Delay between retries in milliseconds (exponential backoff)
 * @type {number}
 */
const INITIAL_RETRY_DELAY = 1000;

/**
 * Timeout for OpenAI API calls in milliseconds
 * @type {number}
 */
const API_TIMEOUT = 120000; // 2 minutes

/**
 * Timeout for image generation API calls that need more time
 * @type {number}
 */
const IMAGE_API_TIMEOUT = 180000; // 3 minutes

/**
 * Maximum request processing time before returning a timeout response
 * @type {number}
 */
const SERVER_TIMEOUT = 25000; // 25 seconds

/**
 * Longer timeout for image generation requests
 * @type {number}
 */
const IMAGE_SERVER_TIMEOUT = 60000; // 60 seconds

/**
 * API handler for OpenAI requests
 * This endpoint acts as a proxy between the frontend and OpenAI API
 * @param {Request} request - The incoming HTTP request
 * @returns {Response} - The response from OpenAI or an error
 */
export default async function handler(request, response) {
    // Only allow POST requests
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    // Verify that OPENAI_API_KEY is set
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error('OPENAI_API_KEY is not set');
        return response.status(500).json({ error: 'Server configuration error: API key not set' });
    }

    try {
        // Parse the request body
        const reqBody = request.body;
        const action = reqBody.action;

        if (!action) {
            return response.status(400).json({ error: 'Action parameter is required' });
        }

        console.log(`Processing ${action} request:`, JSON.stringify(reqBody));

        // Check if this is an image generation request to set appropriate timeouts
        const isImageRequest = action === 'generateMoviePoster';

        // Set up a timeout that will prevent the handler from hanging
        // Use longer timeout for image generation
        const timeoutDuration = isImageRequest ? IMAGE_SERVER_TIMEOUT : SERVER_TIMEOUT;
        const timeoutId = setTimeout(() => {
            console.warn(`Request timed out after ${timeoutDuration}ms for ${action}`);
            return response.status(504).json({
                error: 'Request timed out',
                message: 'The server timed out while waiting for OpenAI to respond. Please try again with a simpler request.',
                retry: true,
                errorType: 'timeout'
            });
        }, timeoutDuration);

        // Initialize OpenAI client with appropriate timeout
        const openai = new OpenAI({
            apiKey: apiKey,
            maxRetries: MAX_RETRIES,
            timeout: isImageRequest ? IMAGE_API_TIMEOUT : API_TIMEOUT, // Use longer timeout for image generation
        });

        // Handle different actions
        let result;
        switch (action) {
            case 'generateTitle':
                result = await executeWithRetry(() => generateTitle(openai, reqBody.plotElements));
                clearTimeout(timeoutId);
                return response.status(200).json({ title: result });

            case 'generateMoviePlot':
                result = await executeWithRetry(() => generateMoviePlot(openai, reqBody.plotElements));
                clearTimeout(timeoutId);
                return response.status(200).json({
                    title: result.title || reqBody.plotElements.title || '',
                    plot: result.plot || ''
                });

            case 'generatePosterDescription':
                result = await executeWithRetry(() => generatePosterDescription(openai, { plot: reqBody.plot, style: reqBody.style }));
                clearTimeout(timeoutId);
                return response.status(200).json({ description: result });

            case 'generateMoviePoster':
                // Using the special executeWithRetryForImages function with longer timeouts
                result = await executeWithRetry(() => generateMoviePoster(openai, { plot: reqBody.plot, style: reqBody.style }), true);
                clearTimeout(timeoutId);
                return response.status(200).json({ imageUrl: result });

            case 'generateMovieTrailer':
                result = await executeWithRetry(() => generateMovieTrailer(openai, reqBody.plotElements));
                clearTimeout(timeoutId);
                return response.status(200).json({ trailer: result });

            case 'generateTrailerAudio':
                result = await executeWithRetry(() => generateTrailerAudio(openai, { trailerText: reqBody.trailerText }));
                clearTimeout(timeoutId);
                // For audio, we need to handle differently since it's binary data
                if (typeof result === 'string') {
                    return response.status(200).json({ audio: result });
                } else {
                    return result;
                }

            case 'generateMultipleMovies':
                result = await executeWithRetry(() => generateMultipleMovies(openai, { count: reqBody.count || 3 }));
                clearTimeout(timeoutId);
                return response.status(200).json({ movies: result });

            default:
                clearTimeout(timeoutId);
                return response.status(400).json({ error: `Invalid action: ${action}` });
        }
    } catch (error) {
        // Make sure to clear any hanging timeouts
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        console.error('Error processing OpenAI request:', error);

        // Get HTTP status code from the error if available
        const statusCode = error.status ||
            (error.response && error.response.status) ||
            500;

        // Determine the type of error
        const isRateLimit = statusCode === 429 || (error.message && error.message.includes('rate limit'));
        const isTimeout = statusCode === 504 ||
            (error.message && (
                error.message.includes('timeout') ||
                error.message.includes('timed out')
            ));

        // Enhanced error reporting
        const errorResponse = {
            error: isRateLimit ? 'Rate limit exceeded' :
                isTimeout ? 'Request timed out' :
                    'Error processing request',
            message: error.message || 'Unknown error occurred',
            retry: isRateLimit || statusCode >= 500 || isTimeout,
            errorType: isTimeout ? 'timeout' :
                isRateLimit ? 'rate_limit' :
                    'api_error',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        };

        if (error.response) {
            errorResponse.openaiError = {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            };
        }

        // Keep stack trace for development, but not in production
        if (process.env.NODE_ENV === 'development') {
            console.error('Detailed error:', error);
        }

        return response.status(statusCode).json(errorResponse);
    }
}

/**
 * Execute a function with retry logic for transient errors
 * @param {Function} fn - Function to execute
 * @param {boolean} isImageRequest - Whether this is an image generation request
 * @returns {Promise<any>} - Result of the function
 * @throws {Error} - Throws if all retries fail
 */
async function executeWithRetry(fn, isImageRequest = false) {
    let lastError;
    let delay = INITIAL_RETRY_DELAY;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            // Set a timeout promise to race against the function execution
            // Use longer timeout for image generation
            const timeoutDuration = isImageRequest ? IMAGE_API_TIMEOUT : API_TIMEOUT;
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    const timeoutError = new Error('Operation timed out');
                    timeoutError.status = 504;
                    reject(timeoutError);
                }, timeoutDuration);
            });

            // Race the function against the timeout
            return await Promise.race([fn(), timeoutPromise]);
        } catch (error) {
            lastError = error;

            // Check specifically for timeout errors
            const isTimeout = error.status === 504 ||
                (error.message && (
                    error.message.includes('timeout') ||
                    error.message.includes('timed out')
                ));

            // Only retry on server errors (5xx), rate limiting (429), or timeouts
            const shouldRetry =
                error.status === 429 || // Rate limit
                isTimeout ||
                (error.status && error.status >= 500 && error.status < 600) || // Server error
                (error.response && error.response.status === 429) || // Rate limit via response
                (error.response && error.response.status >= 500 && error.response.status < 600); // Server error via response

            if (!shouldRetry || attempt >= MAX_RETRIES) {
                throw error; // Don't retry client errors or if we've exceeded max retries
            }

            console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);

            // Wait before retrying with exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
        }
    }

    throw lastError; // This will only be reached if the loop exits without returning
}

/**
 * Generate a dynamic title for a Jason Statham movie
 * @param {Object} openai - OpenAI client instance
 * @param {Object} elements - Elements to inspire the title
 * @returns {Promise<string>} - Generated title
 */
async function generateTitle(openai, plotElements) {
    if (!plotElements) {
        throw new Error('Plot elements are required to generate a title');
    }

    const prompt = plotElements.plotDescription
        ? `Create an exciting, punchy title for a Jason Statham action movie with this plot: ${plotElements.plotDescription}`
        : `Create an exciting, punchy title for a Jason Statham action movie with these elements:
           - Former profession: ${plotElements.formerProfession || 'special forces'}
           - Setting: ${plotElements.setting || 'urban environment'}
           - Villain type: ${plotElements.villain || 'crime syndicate'}
           - Key theme: ${plotElements.plotTrigger || 'revenge'}`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a Hollywood movie title creator specializing in action films. Create short, powerful titles that would work for Jason Statham movies. Respond with ONLY the title, nothing else.'
                },
                { role: 'user', content: prompt }
            ],
            max_tokens: 30,
            temperature: 0.7,
        });

        // Clean up any extra formatting or quotes
        let title = response.choices[0].message.content.trim();
        title = title.replace(/^["']|["']$/g, ''); // Remove surrounding quotes if present

        return title;
    } catch (error) {
        console.error('Error generating title:', error);
        throw new Error(`Failed to generate title: ${error.message || 'Unknown error'}`);
    }
}

/**
 * Generate a movie plot using OpenAI
 * @param {Object} openai - OpenAI client instance
 * @param {Object} plotElements - Elements to include in the plot
 * @returns {Promise<Object>} - Generated plot with title
 */
async function generateMoviePlot(openai, plotElements) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a creative film writer specializing in Jason Statham action movies. Create a detailed, entertaining plot summary for a Jason Statham movie that feels authentic to his style. Keep it action-packed, somewhat over-the-top, but still following a coherent narrative. Jason Statham is always the star and hero.'
                },
                {
                    role: 'user',
                    content: `Create a full plot summary for a Jason Statham movie with these elements to inspire you:

${plotElements.title ? `Title: "${plotElements.title}"` : 'Generate an original title'}
Setting: ${plotElements.setting}
Statham's former profession: ${plotElements.formerProfession}
Statham's current job: ${plotElements.currentJob}
Plot trigger: ${plotElements.plotTrigger}
Main villain: ${plotElements.villain}
Villain's organization: ${plotElements.villainGroup}
Statham's sidekick: ${plotElements.sidekick}
Plot twist: ${plotElements.plotTwist}
Featured vehicle: ${plotElements.vehicle}
Signature weapon: ${plotElements.weapon}
Key action scene: ${plotElements.actionScene}
Villain's hideout: ${plotElements.villainHideout}
Final confrontation: ${plotElements.bossFight}
How the villain is defeated: ${plotElements.bossKill}
${plotElements.hasCameo ? `Surprise cameo by: ${plotElements.cameo}` : ''}

Write a complete, cohesive plot summary that incorporates these elements naturally. Make it sound like a real movie synopsis, not just a list of elements. Focus on creating a compelling narrative that showcases Jason Statham's action hero persona.

${!plotElements.title ? 'Also, suggest a dynamic, punchy title for this movie at the beginning of your response prefixed with "TITLE: "' : ''}
`
                }
            ],
            max_tokens: 1000,
            temperature: 0.8,
        });

        const content = response.choices[0].message.content.trim();

        // Extract title if none was provided
        let title = plotElements.title;
        let plot = content;

        if (!title) {
            const titleMatch = content.match(/^TITLE:\s*(.+?)(?:\n|$)/i);
            if (titleMatch) {
                title = titleMatch[1].trim();
                plot = content.replace(/^TITLE:\s*.+?(?:\n|$)/i, '').trim();
            } else {
                // If no title format found, generate one separately
                title = await generateTitle(openai, { plotDescription: content });
            }
        }

        return {
            title: title,
            plot: plot
        };
    } catch (error) {
        console.error('Error generating plot:', error);
        throw error;
    }
}

/**
 * Generate a movie trailer script using OpenAI
 * This function creates a professional movie trailer voice-over script
 * that sounds like it came from a real Hollywood trailer
 *
 * @param {Object} openai - OpenAI client instance
 * @param {Object} plotElements - Elements to include in the trailer
 * @returns {Promise<string>} - Generated trailer script
 */
async function generateMovieTrailer(openai, plotElements) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: `You are Don LaFontaine, the legendary movie trailer voice-over artist known for iconic phrases like "In a world..."
Create an engaging, dramatic trailer script for a Jason Statham action movie.

Guidelines for an authentic movie trailer script:
- Write in short, punchy sentences with dramatic pauses
- Use present tense and active voice
- Include iconic trailer phrases like "One man...", "In a world where...", etc.
- Format the script with clear PAUSES, EMPHASIZED WORDS, and sound effect indicators [BOOM]
- Maintain a rhythm of building tension and excitement
- Keep it under 60 seconds when read aloud (about 150 words)
- End with the movie title and a powerful tagline
- Include text that indicates how certain words should be delivered (whispered, shouted, etc.)
- The script should be immediately ready for voice recording`
                },
                {
                    role: 'user',
                    content: `Create a dramatic movie trailer voice-over script for a Jason Statham film titled "${plotElements.title}" with these elements:

Plot summary: ${plotElements.plot || plotElements.summary || "Use the plot elements below to craft a cohesive narrative"}
Setting: ${plotElements.setting}
Statham's background: Former ${plotElements.formerProfession}, now ${plotElements.currentJob}
Main conflict: ${plotElements.plotTrigger}
Villain: ${plotElements.villain} and their ${plotElements.villainGroup}
Key action: ${plotElements.actionScene}
Plot twist: ${plotElements.plotTwist}
Final confrontation: ${plotElements.bossFight}
${plotElements.hasCameo ? `Special appearance by: ${plotElements.cameo}` : ''}

Write ONLY the trailer voice-over narration script as it would be performed by Don LaFontaine. Format it so it's instantly ready for voice recording, with indications for dramatic pauses, emphasis, and tone.`
                }
            ],
            max_tokens: 500,
            temperature: 0.7,
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error generating trailer script:', error);
        throw error;
    }
}

/**
 * Generate a poster description using OpenAI
 * @param {Object} openai - OpenAI client instance
 * @param {Object} params - Plot elements and style
 * @returns {Promise<string>} - Generated poster description
 */
async function generatePosterDescription(openai, params) {
    try {
        const { plot, style } = params;
        const { title, formerProfession, setting, villain, hasCameo, cameo, plot: plotText, summary } = plot;

        const styleDescriptions = {
            action: 'high-contrast with dramatic lighting, typically featuring blues and oranges, with explosions, action poses, and urban environments',
            artsy: 'minimalist, artistic approach with bold colors, negative space, symbolic imagery, and artistic representation rather than literal',
            vintage: 'retro style with grainy textures, faded colors, and a 1970s-80s aesthetic reminiscent of classic action movie posters'
        };

        const prompt = `Create a two-part movie poster description for an action film titled "${title}" starring Jason Statham.

Part 1: Write a single powerful tagline for the poster (one sentence).

Part 2: Describe in detail what the poster would look like in a ${style} style.
The poster should be ${styleDescriptions[style]}.

Summary of the movie: ${plotText || summary || ''}

Include these elements:
- Jason Statham as a former ${formerProfession}
- Setting: ${setting}
- Main villain or threat: ${villain}
${hasCameo ? `- Include ${cameo} in the poster` : ''}

For Part 2, be specific about visual elements, composition, positioning, color scheme, and atmosphere. Describe how Jason Statham is portrayed, what he's doing, what weapons or props are visible, and how the title is displayed. Make it detailed enough that someone could visualize and create this poster.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{
                role: 'user',
                content: prompt
            }],
            temperature: 0.7,
            max_tokens: 600
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error generating poster description:', error);
        throw error;
    }
}

/**
 * Generate a movie poster using OpenAI's DALL-E 3 image generation API
 * @param {Object} openai - OpenAI client instance
 * @param {Object} params - Parameters including plot elements and style
 * @returns {Promise<string>} - URL to the generated poster image
 */
async function generateMoviePoster(openai, params) {
    try {
        const { plot, style } = params;
        if (!plot || !style) {
            throw new Error('Missing required parameters: plot and style');
        }

        // Get the essential information to create the poster
        const { title, formerProfession, setting, villain } = plot;

        // Make sure title exists - this is critical for the poster
        if (!title) {
            throw new Error('Movie title is required for poster generation');
        }

        // Simplified prompt approach to avoid potential policy violations
        let posterPrompt = '';

        if (style === 'action') {
            posterPrompt = `Create a professional movie poster for an action thriller titled "${title}" starring Jason Statham.
            Use a high-contrast style with dramatic lighting, blues and oranges color scheme.
            Show Statham in a heroic action pose. Set in ${setting}.
            Include the title "${title}" in bold, impactful typography.`;
        }
        else if (style === 'artsy') {
            posterPrompt = `Create an artistic movie poster for a film titled "${title}" starring Jason Statham.
            Use a minimalist approach with bold colors, negative space, and symbolic imagery.
            Include an artistic representation of the conflict between Statham's character and ${villain}.
            Display the title "${title}" in stylized, artistic typography.`;
        }
        else { // vintage style
            posterPrompt = `Create a vintage-style movie poster for "${title}" starring Jason Statham.
            Use a retro 1970s-80s action film aesthetic with grainy texture and slightly faded colors.
            Feature Statham in a classic action pose appropriate for the ${setting} setting.
            Use retro typography for the title "${title}".`;
        }

        // Add context about the character without being too specific
        posterPrompt += ` Statham plays a former ${formerProfession}.`;

        console.log('Generating poster with prompt:', posterPrompt);

        // Try to ensure DALL-E completes successfully with these parameters
        const imageResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: posterPrompt,
            n: 1,
            size: "1024x1024", // Using standard square format which has better success rate
            quality: "standard", // Using standard quality to avoid potential errors
            style: "vivid",
            response_format: "url"
        });

        // Check for a valid response
        if (!imageResponse || !imageResponse.data || !imageResponse.data[0] || !imageResponse.data[0].url) {
            throw new Error('No valid image data returned from DALL-E API');
        }

        const imageUrl = imageResponse.data[0].url;
        console.log('Successfully generated poster image:', imageUrl);

        return imageUrl;
    } catch (error) {
        // Enhanced error logging with complete details
        console.error('DALL-E Image Generation Error:', {
            message: error.message,
            status: error.status,
            data: error.response?.data,
            stack: error.stack
        });

        // Make sure we're propagating enough details for debugging
        const enhancedError = new Error(`Failed to generate movie poster: ${error.message}`);
        enhancedError.status = error.status || 500;
        enhancedError.originalError = error;
        throw enhancedError;
    }
}

/**
 * Generate trailer audio using OpenAI's TTS service
 * @param {Object} openai - OpenAI client instance
 * @param {Object} params - Parameters including trailer text
 * @returns {Promise<string>} - Base64-encoded audio data
 */
async function generateTrailerAudio(openai, params) {
    try {
        // Extract the trailer text
        const { trailerText } = params;
        if (!trailerText || typeof trailerText !== 'string') {
            throw new Error('Invalid or missing trailer text');
        }

        // Prepare the script for TTS by cleaning up any formatting
        let script = trailerText;

        // Replace common formatting patterns for better speech synthesis
        script = script.replace(/\[([^\]]+)\]/g, ''); // Remove sound effect indicators
        script = script.replace(/\(([^)]+)\)/g, ''); // Remove direction notes
        script = script.replace(/\*([^*]+)\*/g, '$1'); // Remove asterisks but keep text

        // Add appropriate pauses
        script = script.replace(/\.\.\./g, ' <break time="1s"/> ');
        script = script.replace(/\./g, '. <break time="0.5s"/> ');

        // Fix Statham pronunciation using SSML phonetics
        // Replace all instances of "Statham" with the phonetic pronunciation "Stay-thum"
        script = script.replace(/Statham/gi, '<phoneme alphabet="ipa" ph="steɪθəm">Statham</phoneme>');

        // Improve overall voice quality with SSML markup
        script = `<speak>
            <prosody rate="95%" pitch="+0%" volume="loud">
                ${script}
            </prosody>
        </speak>`;

        // Truncate if needed (TTS-1 has a character limit)
        const maxLength = 4000; // Increased slightly for SSML tags
        if (script.length > maxLength) {
            console.warn(`Trailer script too long (${script.length} chars), truncating to ${maxLength}`);
            // Try to find a good place to cut, such as at a sentence or paragraph break
            const truncated = script.substring(0, maxLength);
            // Make sure we close any open SSML tags
            script = truncated.includes('</speak>') ? truncated : `${truncated}</prosody></speak>`;
        }

        console.log('Sending TTS request with script length:', script.length);

        const response = await openai.audio.speech.create({
            model: 'tts-1-hd', // Use HD model for better quality
            voice: 'onyx', // Deep, dramatic voice perfect for movie trailers
            input: script,
            response_format: 'mp3',
            speed: 0.95, // Slightly slower for dramatic effect
        });

        // Convert the response to a base64 string for transport
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');

        return base64;
    } catch (error) {
        console.error('Error generating trailer audio:', error);
        throw error;
    }
}

/**
 * Generate multiple movie plots for studio mode
 * @param {Object} openai - OpenAI client instance
 * @param {Object} params - Parameters with count of movies to generate
 * @returns {Promise<Array>} - Array of generated movies
 */
async function generateMultipleMovies(openai, params) {
    try {
        const { count } = params;

        // Validate count parameter
        const movieCount = Number(count);
        if (isNaN(movieCount) || movieCount < 1 || movieCount > 5) {
            throw new Error('Invalid count parameter: must be a number between 1 and 5');
        }

        const prompt = `Generate ${movieCount} unique and original action movie concepts starring Jason Statham.

For each movie, include:
1. Title (creative and original - avoid sequels to existing franchises)
2. A brief plot summary (2-3 sentences)
3. Character: what former profession Jason Statham's character had
4. Setting: where the main action takes place
5. Main villain
6. A key action scene

Format each movie as a JSON object like this:
{
  "title": "Movie Title",
  "plot": "Brief plot summary",
  "character": "Former profession",
  "setting": "Location/setting",
  "villain": "Main villain",
  "actionScene": "Description of key action scene"
}

Return the results as a JSON array of these objects.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{
                role: 'user',
                content: prompt
            }],
            temperature: 0.8,
            max_tokens: 1000,
            response_format: { type: "json_object" }
        });

        // Parse the response
        try {
            const content = response.choices[0].message.content.trim();
            console.log('Raw response from OpenAI:', content);

            // Try to parse the JSON response
            let jsonResponse;
            try {
                jsonResponse = JSON.parse(content);
            } catch (parseError) {
                // Try to extract JSON from the response if it's not valid JSON
                const jsonMatch = content.match(/(\[[\s\S]*\])|(\{[\s\S]*\})/);
                if (jsonMatch) {
                    jsonResponse = JSON.parse(jsonMatch[0]);
                } else {
                    throw parseError;
                }
            }

            // Handle different response formats
            if (Array.isArray(jsonResponse)) {
                return jsonResponse;
            } else if (jsonResponse.movies && Array.isArray(jsonResponse.movies)) {
                return jsonResponse.movies;
            } else {
                // If we get an object with properties like title, plot, etc., wrap it in an array
                if (jsonResponse.title && jsonResponse.plot) {
                    return [jsonResponse];
                }

                // Try to extract movie objects from the response
                const movies = [];
                for (const key in jsonResponse) {
                    if (typeof jsonResponse[key] === 'object' && jsonResponse[key].title) {
                        movies.push(jsonResponse[key]);
                    }
                }

                if (movies.length > 0) {
                    return movies;
                }

                console.error('Unexpected JSON structure:', jsonResponse);
                // Return at least an empty array to avoid null reference errors
                return [];
            }
        } catch (err) {
            console.error('Error parsing JSON response:', err);
            console.error('Raw response:', response.choices[0].message.content);
            // Return at least an empty array to avoid null reference errors
            return [];
        }
    } catch (error) {
        console.error('Error generating multiple movies:', error);
        throw new Error(`Failed to generate movies: ${error.message || 'Unknown error'}`);
    }
}
