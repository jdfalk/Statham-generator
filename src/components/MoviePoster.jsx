import React, { useState } from 'react';

function MoviePoster({ plot }) {
    const [posterStyle, setPosterStyle] = useState('action'); // action, artsy, vintage

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

    return (
        <div className="movie-poster">
            <h3>Movie Poster Concept</h3>

            {!plot ? (
                <p>Generate a plot first to see a poster concept!</p>
            ) : (
                <>
                    <div className="poster-styles">
                        <button
                            className={posterStyle === 'action' ? 'active' : ''}
                            onClick={() => setPosterStyle('action')}
                        >
                            Action
                        </button>
                        <button
                            className={posterStyle === 'artsy' ? 'active' : ''}
                            onClick={() => setPosterStyle('artsy')}
                        >
                            Artistic
                        </button>
                        <button
                            className={posterStyle === 'vintage' ? 'active' : ''}
                            onClick={() => setPosterStyle('vintage')}
                        >
                            Vintage
                        </button>
                    </div>

                    <div className={`poster-concept ${posterStyle}`}>
                        <div className="poster-title">
                            <h2>{plot.title.toUpperCase()}</h2>
                        </div>

                        <div className="poster-tagline">
                            <p>"{posterConcept.tagline}"</p>
                        </div>

                        <div className="poster-visualization">
                            <h4>POSTER VISUALIZATION</h4>
                            <p>{posterConcept.visualTheme}</p>

                            <div className="poster-details">
                                <p><strong>Style:</strong> {posterStyle}</p>
                                <p><strong>Featuring:</strong> Jason Statham as a former {plot.formerProfession}</p>
                                {plot.hasCameo && <p><strong>With:</strong> {plot.cameo}</p>}
                                <p><strong>Setting:</strong> {plot.setting}</p>
                            </div>
                        </div>

                        <div className="poster-credits">
                            <p>JASON STATHAM</p>
                            <p>Directed by MICHAEL BAY | Written by CHRISTOPHER NOLAN</p>
                            <p>COMING SOON</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default MoviePoster;
