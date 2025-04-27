/**
 * Flag indicating whether API functionality is available
 * @type {boolean}
 */
let apiAvailable = true;

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
    return apiAvailable;
};

/**
 * Reset API availability flag
 */
export const clearOpenAI = () => {
    apiAvailable = true;
};

/**
 * Make a request to the server-side OpenAI API endpoint
 * @param {string} action - The action to perform
 * @param {Object} params - Parameters for the action
 * @returns {Promise<any>} - Response from the API
 */
async function callServerAPI(action, params) {
    try {
        const response = await fetch('/api/openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, params }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Server error');
        }

        const data = await response.json();
        return data.result;
    } catch (error) {
        console.error(`Error calling ${action}:`, error);
        apiAvailable = false;
        throw error;
    }
}

/**
 * Generate a movie plot using OpenAI
 * @param {Object} plotElements - Elements to include in the plot
 * @returns {Promise<string>} - Generated plot
 */
export const generateMoviePlot = async (plotElements) => {
    try {
        return await callServerAPI('generateMoviePlot', plotElements);
    } catch (error) {
        console.error('Error generating plot with OpenAI:', error);
        return null;
    }
};

/**
 * Generate a movie trailer script using OpenAI
 * @param {Object} plotElements - Elements to include in the trailer
 * @returns {Promise<string>} - Generated trailer script
 */
export const generateMovieTrailer = async (plotElements) => {
    try {
        return await callServerAPI('generateMovieTrailer', plotElements);
    } catch (error) {
        console.error('Error generating trailer with OpenAI:', error);
        return null;
    }
};

/**
 * Generate a poster description using OpenAI
 * @param {Object} plot - Plot elements
 * @param {string} style - Poster style (action, artsy, vintage)
 * @returns {Promise<string>} - Generated poster description
 */
export const generatePosterDescription = async (plot, style) => {
    try {
        return await callServerAPI('generatePosterDescription', { plot, style });
    } catch (error) {
        console.error('Error generating poster description:', error);
        return null;
    }
};

/**
 * Generate trailer audio using OpenAI
 * @param {string} trailerText - Trailer script text
 * @returns {Promise<string>} - URL to audio blob
 */
export const generateTrailerAudio = async (trailerText) => {
    try {
        const base64Audio = await callServerAPI('generateTrailerAudio', { trailerText });

        // Convert base64 to blob and create URL
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const audioBlob = new Blob([bytes.buffer], { type: 'audio/mpeg' });
        return URL.createObjectURL(audioBlob);
    } catch (error) {
        console.error('Error generating audio:', error);
        return null;
    }
};

/**
 * Generate multiple movie plots for studio mode
 * @param {number} count - Number of movies to generate
 * @returns {Promise<Array>} - Array of generated movies
 */
export const generateMultipleMovies = async (count) => {
    try {
        return await callServerAPI('generateMultipleMovies', { count });
    } catch (error) {
        console.error('Error generating multiple movies:', error);
        return [];
    }
};

export default {
    initializeOpenAI,
    isOpenAIInitialized,
    clearOpenAI,
    generateMoviePlot,
    generateMovieTrailer,
    generatePosterDescription,
    generateTrailerAudio,
    generateMultipleMovies
};
