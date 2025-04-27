import React, { useState, useEffect } from 'react';
import { generatePosterDescription, generateMoviePoster } from '../services/openaiService';

function MoviePoster({ plot, openaiEnabled = false }) {
    const [posterStyle, setPosterStyle] = useState('action'); // action, artsy, vintage
    const [aiPosterDescription, setAiPosterDescription] = useState('');
    const [posterImageUrl, setPosterImageUrl] = useState('');
    const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [useAI, setUseAI] = useState(true);
    const [useSora, setUseSora] = useState(true);
    const [error, setError] = useState(null);

    // Poster concepts
    const posterConcepts = {
        action: {
            filters: ['high-contrast', 'dramatic lighting', 'desaturated', 'moody blues and oranges'],
            layouts: [
                'Jason Statham walking away from an explosion',
                'Jason Statham standing on a rooftop overlooking the city',
                'Jason Statham in a fighting stance with weapons drawn',
                'Close-up of Jason Statham\'s face with a determined expression',
                'Jason Statham in a car/motorcycle with motion blur',
            ],
            elements: [
                'raining cityscape', 'shattered glass', 'bullet holes',
                'burning vehicles', 'shadowy figures', 'helicopters',
                'skyscrapers', 'lens flares', 'reflections in sunglasses'
            ]
        },
        artsy: {
            filters: ['minimalist', 'silhouette style', 'bold colors', 'geometric patterns'],
            layouts: [
                'Abstract silhouette of Jason Statham with a weapon',
                'Split-screen showing the dual nature of the character',
                'Fragmented image showing different aspects of the plot',
                'Single iconic object representing the film (gun, car, etc.)',
                'Surreal composition blending character and setting',
            ],
            elements: [
                'negative space', 'symbolic imagery', 'stark color contrast',
                'typography as art', 'hand-drawn elements', 'metaphorical objects',
                'artistic blood splatter', 'abstract city elements'
            ]
        },
        vintage: {
            filters: ['grainy texture', 'faded colors', 'letterbox format', 'worn edges'],
            layouts: [
                '1970s-style multiple character panels',
                'Jason Statham in a classic action pose reminiscent of old movie posters',
                'Painted portrait style of the main characters',
                'Montage of action scenes in comic book style panels',
                'Oversized title with smaller action vignettes',
            ],
            elements: [
                'retro typography', 'halftone patterns', 'faded photography',
                'old film scratches', 'vintage color palette', 'hand-painted look',
                'classic movie star composition', 'block lettering'
            ]
        }
    };

    // Tagline generation
    const taglinePrefixes = [
        'In a world where', 'When', 'This time',
        'Some men just want to', 'They took everything. Now',
        'Never', 'The only way out is', 'No mercy.',
        'Redemption has a name.'
    ];

    const taglineMiddles = [
        'justice is blind', 'vengeance is the only option',
        'there are no rules', 'one man stands alone',
        'survival is just the beginning', 'the hunter becomes the hunted',
        'the past never stays buried', 'betrayal has a price'
    ];

    const taglineSuffixes = [
        '.', '...', ' - and his name is STATHAM.',
        ' - there\'s only one solution.', '. No mercy.',
        '. No surrender.', '. No going back.', '. Only revenge.'
    ];

    const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // Generate OpenAI poster description when plot or poster style changes
    useEffect(() => {
        if (plot && openaiEnabled && useAI) {
            generateAIPosterDescription();
        }
    }, [plot, posterStyle, useAI]);

    // Generate a poster description using OpenAI
    const generateAIPosterDescription = async () => {
        if (!plot || !openaiEnabled || !useAI) return;

        setIsGeneratingDescription(true);
        setError(null);

        try {
            const description = await generatePosterDescription(plot, posterStyle);
            if (description) {
                setAiPosterDescription(description);

                // Generate poster image with SORA if enabled
                if (useSora) {
                    generatePosterImage();
                }
            }
        } catch (error) {
            console.error('Error generating poster description:', error);
            setError('Failed to generate poster description. Please try again.');
        } finally {
            setIsGeneratingDescription(false);
        }
    };

    // Generate a poster image using SORA
    const generatePosterImage = async () => {
        if (!plot || !openaiEnabled || !useAI || !useSora) return;

        setIsGeneratingImage(true);
        setError(null);
        setPosterImageUrl('');

        try {
            const imageUrl = await generateMoviePoster(plot, posterStyle);
            if (imageUrl) {
                setPosterImageUrl(imageUrl);
            } else {
                throw new Error('No image URL returned');
            }
        } catch (error) {
            console.error('Error generating poster image with SORA:', error);
            setError('Failed to generate poster image. Please try again.');
        } finally {
            setIsGeneratingImage(false);
        }
    };

    // Generate a poster concept based on the plot and selected style
    const generatePosterConcept = () => {
        if (!plot) return null;

        const style = posterConcepts[posterStyle];
        const tagline = `${random(taglinePrefixes)} ${random(taglineMiddles)}${random(taglineSuffixes)}`;

        return {
            style: posterStyle,
            filter: random(style.filters),
            layout: random(style.layouts),
            elements: [random(style.elements), random(style.elements)],
            tagline: tagline,
            visualTheme: `A ${posterStyle} style poster with ${random(style.filters)} featuring ${random(style.layouts)}, incorporating ${random(style.elements)} and ${random(style.elements)}.`,
        };
    };

    const posterConcept = plot ? generatePosterConcept() : null;

    // Handle style change
    const handleStyleChange = (style) => {
        setPosterStyle(style);
        // Clear the current poster image when style changes
        setPosterImageUrl('');
    };

    return (
        <div className="movie-poster">
            <h3>Movie Poster</h3>

            {!plot ? (
                <p>Generate a plot first to see a poster concept!</p>
            ) : (
                <>
                    <div className="poster-styles">
                        <button
                            className={posterStyle === 'action' ? 'active' : ''}
                            onClick={() => handleStyleChange('action')}
                        >
                            Action
                        </button>
                        <button
                            className={posterStyle === 'artsy' ? 'active' : ''}
                            onClick={() => handleStyleChange('artsy')}
                        >
                            Artistic
                        </button>
                        <button
                            className={posterStyle === 'vintage' ? 'active' : ''}
                            onClick={() => handleStyleChange('vintage')}
                        >
                            Vintage
                        </button>

                        {openaiEnabled && (
                            <>
                                <label className="ai-toggle">
                                    <input
                                        type="checkbox"
                                        checked={useAI}
                                        onChange={() => {
                                            setUseAI(!useAI);
                                            if (!useAI) {
                                                setPosterImageUrl('');
                                            }
                                        }}
                                    />
                                    AI Descriptions
                                </label>

                                {useAI && (
                                    <label className="sora-toggle">
                                        <input
                                            type="checkbox"
                                            checked={useSora}
                                            onChange={() => {
                                                const newUseSora = !useSora;
                                                setUseSora(newUseSora);
                                                if (newUseSora && !posterImageUrl) {
                                                    generatePosterImage();
                                                }
                                            }}
                                        />
                                        SORA Poster
                                    </label>
                                )}
                            </>
                        )}
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div className={`poster-concept ${posterStyle}`}>
                        {/* Display SORA-generated poster if available */}
                        {posterImageUrl && (
                            <div className="sora-poster-image">
                                <img src={posterImageUrl} alt={`${plot.title} movie poster`} />
                            </div>
                        )}

                        {/* Show loading indicator while generating image */}
                        {isGeneratingImage && (
                            <div className="generating-poster">
                                <div className="loading-spinner"></div>
                                <p>Generating movie poster with SORA...</p>
                                <p className="small">(This may take a minute)</p>
                            </div>
                        )}

                        {/* Only show the text concept if no image is being generated or displayed */}
                        {!posterImageUrl && !isGeneratingImage && (
                            <>
                                <div className="poster-title">
                                    <h2>{plot.title.toUpperCase()}</h2>
                                </div>

                                <div className="poster-tagline">
                                    <p>"{openaiEnabled && useAI && aiPosterDescription ?
                                        aiPosterDescription.split('\n')[0] :
                                        posterConcept.tagline}"</p>
                                </div>

                                <div className="poster-visualization">
                                    <h4>POSTER VISUALIZATION</h4>
                                    {isGeneratingDescription ? (
                                        <p className="generating-text">Generating AI poster concept...</p>
                                    ) : (
                                        <>
                                            {openaiEnabled && useAI && aiPosterDescription ? (
                                                <div className="ai-poster-description">
                                                    {aiPosterDescription.split('\n').slice(1).map((line, i) => (
                                                        <p key={i}>{line}</p>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p>{posterConcept.visualTheme}</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Always show the details section */}
                        <div className="poster-details">
                            <p><strong>Style:</strong> {posterStyle}</p>
                            <p><strong>Featuring:</strong> Jason Statham as a former {plot.formerProfession}</p>
                            {plot.hasCameo && <p><strong>With:</strong> {plot.cameo}</p>}
                            <p><strong>Setting:</strong> {plot.setting}</p>
                            {!openaiEnabled && (
                                <p><strong>Key Visual:</strong> {posterConcept.layout}</p>
                            )}
                        </div>

                        <div className="poster-credits">
                            <p>JASON STATHAM</p>
                            <p>Directed by MICHAEL BAY | Written by CHRISTOPHER NOLAN</p>
                            <p>COMING SOON</p>
                        </div>

                        {/* Add Generate button for Sora posters */}
                        {openaiEnabled && useAI && useSora && !isGeneratingImage && (
                            <div className="generate-poster-btn">
                                <button
                                    onClick={generatePosterImage}
                                    disabled={isGeneratingImage}
                                    className="generate-btn"
                                >
                                    {posterImageUrl ? 'Regenerate Poster' : 'Generate SORA Poster'}
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default MoviePoster;
