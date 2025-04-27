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
 * This function creates a professional movie trailer voice-over script
 * that sounds like it came from a real Hollywood trailer
 *
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

Plot summary: ${plotElements.summary || "Use the plot elements below to craft a cohesive narrative"}
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
 * Generate trailer audio using OpenAI's TTS service
 * @param {Object} openai - OpenAI client instance
 * @param {string} trailerText - Trailer script text
 * @returns {Promise<string>} - Base64-encoded audio data
 */
async function generateTrailerAudio(openai, { trailerText }) {
    // Prepare the script for TTS by cleaning up any formatting
    let script = trailerText;

    // Replace common formatting patterns for better speech synthesis
    script = script.replace(/\[([^\]]+)\]/g, ''); // Remove sound effect indicators
    script = script.replace(/\(([^)]+)\)/g, ''); // Remove direction notes
    script = script.replace(/\*([^*]+)\*/g, '$1'); // Remove asterisks but keep text

    // Add appropriate pauses
    script = script.replace(/\.\.\./g, ' <break time="1s"/> ');
    script = script.replace(/\./g, '. <break time="0.5s"/> ');

    // Truncate if needed (TTS-1 has a character limit)
    const maxLength = 4000;
    if (script.length > maxLength) {
        script = script.substring(0, maxLength) + '...';
    }

    try {
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
