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
 * Generates a title for a movie based on provided plot elements
 *
 * @param {Object} plotElements - Elements of the plot to use for title generation
 * @returns {Promise<string>} - The generated title
 */
export async function generateTitle(plotElements) {
    try {
        const response = await fetch('/api/openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'generateTitle',
                plotElements
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error: ${response.status}`);
        }

        const data = await response.json();
        return data.title;
    } catch (error) {
        console.error('Error calling generateTitle:', error);
        throw error;
    }
}

/**
 * Generates a movie plot based on provided plot elements
 *
 * @param {Object} plotElements - Elements to include in the plot
 * @returns {Promise<string>} - The generated plot text
 */
export async function generateMoviePlot(plotElements) {
    try {
        const response = await fetch('/api/openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'generateMoviePlot',
                plotElements
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error: ${response.status}`);
        }

        const data = await response.json();
        return data.plot;
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
        const response = await fetch('/api/openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'generateMovieTrailer',
                plotElements
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error: ${response.status}`);
        }

        const data = await response.json();
        return data.trailer;
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
        const response = await fetch('/api/openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'generatePosterDescription',
                plot,
                style
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error: ${response.status}`);
        }

        const data = await response.json();
        return data.description;
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
        const response = await fetch('/api/openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'generateTrailerAudio',
                trailerText
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error: ${response.status}`);
        }

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
        const response = await fetch('/api/openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'generateMultipleMovies',
                count
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error: ${response.status}`);
        }

        const data = await response.json();
        return data.movies;
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
