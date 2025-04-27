import OpenAI from 'openai';

// OpenAI client instance
let openai = null;

/**
 * Initialize the OpenAI client with API key
 * @param {string} apiKey - The OpenAI API key
 * @returns {boolean} - Whether initialization was successful
 */
export const initializeOpenAI = (apiKey) => {
    try {
        openai = new OpenAI({
            apiKey,
            dangerouslyAllowBrowser: true // Note: In production, API calls should be made server-side
        });
        return true;
    } catch (error) {
        console.error('Failed to initialize OpenAI:', error);
        return false;
    }
};

/**
 * Check if OpenAI is initialized
 * @returns {boolean} - Whether OpenAI is initialized
 */
export const isOpenAIInitialized = () => {
    return openai !== null;
};

/**
 * Clear OpenAI client instance
 */
export const clearOpenAI = () => {
    openai = null;
};

/**
 * Generate a movie plot using OpenAI
 * @param {Object} plotElements - Elements to include in the plot
 * @returns {Promise<string>} - Generated plot
 */
export const generateMoviePlot = async (plotElements) => {
    if (!openai) return null;

    try {
        const { title, formerProfession, currentJob, plotTrigger, setting,
                villain, villainGroup, sidekick, plotTwist, vehicle,
                weapon, actionScene, villainHideout, bossFight,
                bossKill, hasCameo, cameo } = plotElements;

        const prompt = `Write a complete, coherent, and natural 3-4 paragraph movie plot summary for an action film titled "${title}" starring Jason Statham.

Use these plot elements to craft a compelling story:
- Jason Statham plays a former ${formerProfession} who now works as a ${currentJob}
- The inciting incident is: ${plotTrigger}
- The setting is: ${setting}
- The main villain is: ${villain}
- Criminal organization involved: ${villainGroup}
- Jason Statham's sidekick is: ${sidekick}
- Major plot twist: ${plotTwist}
- Featured vehicle: ${vehicle}
- Featured weapon: ${weapon}
- Key action scene: ${actionScene}
- Villain's hideout: ${villainHideout}
- Final confrontation: ${bossFight}
- How the villain is defeated: ${bossKill}
${hasCameo ? `- Special cameo by: ${cameo}` : ''}

Write in the style of a professional movie synopsis that sounds like it would appear on a streaming service. Focus on creating a cohesive, exciting narrative that feels like a real Jason Statham movie. Do not include "In this film..." or similar phrases. Just write the plot summary directly.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{
                role: 'user',
                content: prompt
            }],
            temperature: 0.7,
            max_tokens: 500
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error generating movie plot:', error);
        return null;
    }
};

/**
 * Generate a movie trailer script using OpenAI
 * @param {Object} plotElements - Elements to include in the trailer
 * @returns {Promise<string>} - Generated trailer script
 */
export const generateMovieTrailer = async (plotElements) => {
    if (!openai) return null;

    try {
        const { title, formerProfession, plotTrigger, villain,
                plotTwist, actionScene, hasCameo, cameo } = plotElements;

        const prompt = `Write a dramatic movie trailer script for an action film titled "${title}" starring Jason Statham.

The trailer should follow this format:
- Start with dramatic intro phrases like "THIS SUMMER..." or "IN A WORLD..."
- Include short, impactful descriptions of the premise
- Add 2-3 dialogue lines from Jason Statham's character (in quotes)
- Include dramatic one-liners describing the action
- End with a title card and release info

Key elements to include:
- Jason Statham plays a former ${formerProfession}
- The inciting incident: ${plotTrigger}
- The main villain: ${villain}
- Major plot twist: ${plotTwist}
- Key action scene: ${actionScene}
${hasCameo ? `- Special cameo by: ${cameo}` : ''}

Write in the style of a Hollywood action movie trailer with dramatic pauses, impactful short statements, and intense tone. Format with separate lines for each phrase or section.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{
                role: 'user',
                content: prompt
            }],
            temperature: 0.8,
            max_tokens: 350
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error generating movie trailer:', error);
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
    if (!openai) return null;

    try {
        const { title, formerProfession, setting, villain, hasCameo, cameo } = plot;

        const styleDescriptions = {
            action: 'high-contrast with dramatic lighting, typically featuring blues and oranges, with explosions, action poses, and urban environments',
            artsy: 'minimalist, artistic approach with bold colors, negative space, symbolic imagery, and artistic representation rather than literal',
            vintage: 'retro style with grainy textures, faded colors, and a 1970s-80s aesthetic reminiscent of classic action movie posters'
        };

        const prompt = `Create a two-part movie poster description for an action film titled "${title}" starring Jason Statham.

Part 1: Write a single powerful tagline for the poster (one sentence).

Part 2: Describe in detail what the poster would look like in a ${style} style.
The poster should be ${styleDescriptions[style]}.

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
            max_tokens: 400
        });

        return response.choices[0].message.content.trim();
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
    if (!openai) return null;

    try {
        const maxLength = 4000; // OpenAI has a character limit
        const truncatedText = trailerText.length > maxLength
            ? trailerText.substring(0, maxLength) + '...'
            : trailerText;

        const response = await openai.audio.speech.create({
            model: 'tts-1',
            voice: 'onyx', // Deep, dramatic voice perfect for movie trailers
            input: truncatedText,
        });

        // Convert the response to a blob URL that can be played in the browser
        const audioBlob = await response.blob();
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
    if (!openai) return null;

    try {
        const prompt = `Generate ${count} unique action movie concepts starring Jason Statham.

For each movie, include:
1. Title
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

Return the results as a valid JSON array of these objects.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{
                role: 'user',
                content: prompt
            }],
            temperature: 0.8,
            max_tokens: 800,
            response_format: { type: "json_object" }
        });

        // Parse the response and return the array of movies
        try {
            const jsonResponse = JSON.parse(response.choices[0].message.content);
            return jsonResponse.movies || [];
        } catch (err) {
            console.error('Error parsing JSON response:', err);
            return [];
        }
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
