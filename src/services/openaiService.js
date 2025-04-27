import OpenAI from 'openai';

let openai = null;

// Initialize OpenAI client with API key
export const initOpenAI = (apiKey) => {
  openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // For client-side usage
  });

  // Return true if initialization was successful
  return !!openai;
};

// Check if OpenAI client is initialized
export const isInitialized = () => {
  return !!openai;
};

// Generate a movie plot using OpenAI
export const generateMoviePlot = async (plotElements) => {
  if (!openai) return null;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a Hollywood screenwriter specializing in Jason Statham action movies.
          Create an exciting and coherent action movie plot. Make it thrilling, intense, and include
          classic action movie elements. Your response should be in proper screenplay format with sections.`
        },
        {
          role: "user",
          content: `Create a Jason Statham action movie plot with these elements:
          - Former profession: ${plotElements.formerProfession}
          - Current job: ${plotElements.currentJob}
          - Plot trigger: ${plotElements.plotTrigger}
          - Setting: ${plotElements.setting}
          - Villain: ${plotElements.villain}
          - Villain group: ${plotElements.villainGroup}
          - Sidekick: ${plotElements.sidekick}
          - Plot twist: ${plotElements.plotTwist}
          - Vehicle: ${plotElements.vehicle}
          - Weapon: ${plotElements.weapon}
          - Action scene: ${plotElements.actionScene}
          - Villain hideout: ${plotElements.villainHideout}
          - Boss fight: ${plotElements.bossFight}
          - Boss kill: ${plotElements.bossKill}`
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating movie plot:', error);
    return null;
  }
};

// Generate a movie trailer narration using OpenAI
export const generateMovieTrailer = async (plotElements) => {
  if (!openai) return null;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a Hollywood trailer voice-over artist specializing in action movie trailers.
          Create an intense, dramatic movie trailer script with the classic "In a world..." style.
          Use dramatic pauses, intense phrases, and build up to the movie title.`
        },
        {
          role: "user",
          content: `Create a dramatic movie trailer script for a Jason Statham movie titled "${plotElements.title}" with these elements:
          - Former profession: ${plotElements.formerProfession}
          - Plot trigger: ${plotElements.plotTrigger}
          - Setting: ${plotElements.setting}
          - Villain: ${plotElements.villain}
          - Plot twist: ${plotElements.plotTwist}
          - Action scene: ${plotElements.actionScene}

          Make it sound like a real movie trailer with dramatic pauses and intense phrases.
          End with "JASON STATHAM in [MOVIE TITLE]. SUMMER ${new Date().getFullYear()}".`
        }
      ],
      temperature: 0.8,
      max_tokens: 500
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating trailer:', error);
    return null;
  }
};

// Generate a movie poster description using OpenAI
export const generatePosterDescription = async (plotElements, posterStyle) => {
  if (!openai) return null;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a Hollywood poster designer specializing in action movie posters.
          Create a detailed description of what a movie poster for this Jason Statham film would look like.`
        },
        {
          role: "user",
          content: `Create a detailed description for a ${posterStyle} style movie poster for a Jason Statham movie titled "${plotElements.title}" with these elements:
          - Setting: ${plotElements.setting}
          - Villain: ${plotElements.villain}
          - Weapon: ${plotElements.weapon}
          - Action scene: ${plotElements.actionScene}

          The poster should be in ${posterStyle} style (${posterStyle === 'action' ? 'high contrast with explosions and dramatic lighting' :
          posterStyle === 'artsy' ? 'minimalist design with bold colors and symbolic imagery' :
          'vintage style with painted look and classic composition'}).

          Include a catchy tagline for the poster and describe the visual elements in detail.`
        }
      ],
      temperature: 0.7,
      max_tokens: 400
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating poster description:', error);
    return null;
  }
};

// Generate audio for trailer narration using OpenAI text-to-speech
export const generateTrailerAudio = async (trailerScript) => {
  if (!openai) return null;

  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy", // "alloy" is good for trailer-like voice
      input: trailerScript,
    });

    // Convert the response to a blob URL that can be played
    const blob = await mp3.blob();
    const url = URL.createObjectURL(blob);
    return url;
  } catch (error) {
    console.error('Error generating audio:', error);
    return null;
  }
};

export default {
  initOpenAI,
  isInitialized,
  generateMoviePlot,
  generateMovieTrailer,
  generatePosterDescription,
  generateTrailerAudio
};
