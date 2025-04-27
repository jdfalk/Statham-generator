// file: api/openai.js
import { OpenAI } from 'openai';

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
        return response.status(500).json({ error: 'Server configuration error' });
    }

    try {
        // Parse the request body
        const { action, params } = request.body;

        // Initialize OpenAI client
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        // Handle different actions
        let result;
        switch (action) {
            case 'generateMoviePlot':
                result = await generateMoviePlot(openai, params);
                break;
            case 'generateMovieTrailer':
                result = await generateMovieTrailer(openai, params);
                break;
            case 'generatePosterDescription':
                result = await generatePosterDescription(openai, params);
                break;
            case 'generateTrailerAudio':
                result = await generateTrailerAudio(openai, params);
                break;
            case 'generateMultipleMovies':
                result = await generateMultipleMovies(openai, params);
                break;
            default:
                return response.status(400).json({ error: 'Invalid action' });
        }

        // Return the result
        return response.status(200).json({ result });
    } catch (error) {
        console.error('Error processing OpenAI request:', error);
        return response.status(500).json({
            error: 'Error processing request',
            message: error.message
        });
    }
}

/**
 * Generate a movie plot using OpenAI
 * @param {Object} openai - OpenAI client instance
 * @param {Object} plotElements - Elements to include in the plot
 * @returns {Promise<string>} - Generated plot
 */
async function generateMoviePlot(openai, plotElements) {
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

Title: "${plotElements.title}"
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

Write a complete, cohesive plot summary that incorporates these elements naturally. Make it sound like a real movie synopsis, not just a list of elements. Focus on creating a compelling narrative that showcases Jason Statham's action hero persona.`
            }
        ],
        max_tokens: 750,
        temperature: 0.8,
    });

    return response.choices[0].message.content.trim();
}

/**
 * Generate a movie trailer script using OpenAI
 * @param {Object} openai - OpenAI client instance
 * @param {Object} plotElements - Elements to include in the trailer
 * @returns {Promise<string>} - Generated trailer script
 */
async function generateMovieTrailer(openai, plotElements) {
    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
            {
                role: 'system',
                content: 'You are a Hollywood trailer script writer specializing in intense, dramatic action movie trailers featuring Jason Statham. Create a script for a trailer voice-over that captures the essence of a Jason Statham movie - gritty, action-packed, and dramatic. Use the classic trailer voice style with punchy sentences and dramatic pauses.'
            },
            {
                role: 'user',
                content: `Create a movie trailer script for a Jason Statham film titled "${plotElements.title}" with these elements:

Plot summary: ${plotElements.summary || "Use the plot elements below to craft a cohesive narrative"}
Setting: ${plotElements.setting}
Statham's background: ${plotElements.formerProfession}, now ${plotElements.currentJob}
Main conflict: ${plotElements.plotTrigger}
Villain: ${plotElements.villain} and their ${plotElements.villainGroup}
Key action: ${plotElements.actionScene}
Plot twist: ${plotElements.plotTwist}
Final confrontation: ${plotElements.bossFight}

Write only the trailer voice-over narration script. Make it dramatic, intense, and highlight Jason Statham's character. Include classic trailer phrases like "In a world where..." or "One man..." if appropriate. Keep it under 200 words.`
            }
        ],
        max_tokens: 350,
        temperature: 0.7,
    });

    return response.choices[0].message.content.trim();
}

/**
 * Generate a poster description using OpenAI
 * @param {Object} openai - OpenAI client instance
 * @param {Object} plot - Plot elements
 * @param {string} style - Poster style (action, artsy, vintage)
 * @returns {Promise<string>} - Generated poster description
 */
async function generatePosterDescription(openai, { plot, style }) {
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
}

/**
 * Generate trailer audio using OpenAI
 * @param {Object} openai - OpenAI client instance
 * @param {string} trailerText - Trailer script text
 * @returns {Promise<string>} - Base64-encoded audio data
 */
async function generateTrailerAudio(openai, { trailerText }) {
    const maxLength = 4000; // OpenAI has a character limit
    const truncatedText = trailerText.length > maxLength
        ? trailerText.substring(0, maxLength) + '...'
        : trailerText;

    const response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'onyx', // Deep, dramatic voice perfect for movie trailers
        input: truncatedText,
    });

    // Convert the response to a base64 string for transport
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return base64;
}

/**
 * Generate multiple movie plots for studio mode
 * @param {Object} openai - OpenAI client instance
 * @param {number} count - Number of movies to generate
 * @returns {Promise<Array>} - Array of generated movies
 */
async function generateMultipleMovies(openai, { count }) {
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
}
