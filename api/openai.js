// file: api/openai.js
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

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

        // Initialize OpenAI client
        const openai = new OpenAI({
            apiKey: apiKey
        });

        // Handle different actions
        let result;
        switch (action) {
            case 'generateTitle':
                result = await generateTitle(openai, reqBody.plotElements);
                return response.status(200).json({ title: result });

            case 'generateMoviePlot':
                result = await generateMoviePlot(openai, reqBody.plotElements);
                return response.status(200).json({
                    title: result.title || reqBody.plotElements.title || '',
                    plot: result.plot || ''
                });

            case 'generatePosterDescription':
                result = await generatePosterDescription(openai, { plot: reqBody.plot, style: reqBody.style });
                return response.status(200).json({ description: result });

            case 'generateMovieTrailer':
                result = await generateMovieTrailer(openai, reqBody.plotElements);
                return response.status(200).json({ trailer: result });

            case 'generateTrailerAudio':
                result = await generateTrailerAudio(openai, { trailerText: reqBody.trailerText });
                // For audio, we need to handle differently since it's binary data
                if (typeof result === 'string') {
                    return response.status(200).json({ audio: result });
                } else {
                    return result;
                }

            case 'generateMultipleMovies':
                result = await generateMultipleMovies(openai, { count: reqBody.count || 3 });
                return response.status(200).json({ movies: result });

            default:
                return response.status(400).json({ error: `Invalid action: ${action}` });
        }
    } catch (error) {
        console.error('Error processing OpenAI request:', error);

        // Enhanced error reporting
        const errorResponse = {
            error: 'Error processing request',
            message: error.message || 'Unknown error occurred',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        };

        if (error.response) {
            errorResponse.openaiError = {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            };
        }

        return response.status(500).json(errorResponse);
    }
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

        // Truncate if needed (TTS-1 has a character limit)
        const maxLength = 3000; // Reduced to be safe
        if (script.length > maxLength) {
            console.warn(`Trailer script too long (${script.length} chars), truncating to ${maxLength}`);
            script = script.substring(0, maxLength) + '...';
        }

        console.log('Sending TTS request with script length:', script.length);

        const response = await openai.audio.speech.create({
            model: 'tts-1', // Use standard TTS as HD might cause issues
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

        if (!count || typeof count !== 'number' || count < 1 || count > 5) {
            throw new Error('Invalid count parameter: must be a number between 1 and 5');
        }

        const prompt = `Generate ${count} unique and original action movie concepts starring Jason Statham.

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
            const content = response.choices[0].message.content;
            const jsonResponse = JSON.parse(content);

            // Check if the response has the expected structure
            if (Array.isArray(jsonResponse)) {
                return jsonResponse;
            } else if (jsonResponse.movies && Array.isArray(jsonResponse.movies)) {
                return jsonResponse.movies;
            } else {
                console.error('Unexpected JSON structure:', jsonResponse);
                return [];
            }
        } catch (err) {
            console.error('Error parsing JSON response:', err);
            console.error('Raw response:', response.choices[0].message.content);
            return [];
        }
    } catch (error) {
        console.error('Error generating multiple movies:', error);
        throw error;
    }
}
