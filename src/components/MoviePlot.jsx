import React, { useState, useEffect, useRef } from 'react';
import {
    generateMoviePlot,
    generateMovieTrailer,
    generateTrailerAudio
} from '../services/openaiService';

/**
 * Component for generating and displaying movie plots and trailers
 *
 * @param {Object} props - Component props
 * @param {Function} props.onPlotGenerated - Callback when plot is generated
 * @param {boolean} props.studioMode - Whether component is in studio mode
 * @param {boolean} props.openaiEnabled - Whether OpenAI features are enabled
 * @returns {JSX.Element} - React component
 */
function MoviePlot({ onPlotGenerated, studioMode = false, openaiEnabled = false }) {
    const [plot, setPlot] = useState(null);
    const [trailerMode, setTrailerMode] = useState(false);
    const [hardcoreMode, setHardcoreMode] = useState(false);
    const [useAI, setUseAI] = useState(true);
    const [loading, setLoading] = useState(false);
    const [aiGeneratedPlot, setAiGeneratedPlot] = useState('');
    const [aiGeneratedTrailer, setAiGeneratedTrailer] = useState('');
    const [trailerAudioUrl, setTrailerAudioUrl] = useState('');
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const audioRef = useRef(null);

    const titles = [
        'Adrenaline Rush', 'Death Race', 'The Transporter: Final Run',
        'Crank: Ultimate Surge', 'The Mechanic Returns', 'Fast Vengeance',
        'Blitz Force', 'Chaos Redemption', 'Expendable Hero', 'Raw Justice',
        'Terminal Velocity', 'Bulletproof', 'Collision Course', 'Urban Warfare',
        'Dead Zone', 'Last Stand', 'Rogue Agent', 'Lethal Force'
    ];

    const settings = [
        'post-apocalyptic London', 'underground fight club in Bangkok',
        'high-speed train across Europe', 'skyscraper in Dubai',
        'secret government facility', 'luxury yacht in the Mediterranean',
        'abandoned prison complex', 'illegal street racing circuit in Tokyo',
        'remote military outpost', 'elite assassins\' convention'
    ];

    const formerProfessions = [
        'Navy SEAL', 'MI6 Operative', 'Special Forces soldier',
        'undercover cop', 'elite hitman', 'government assassin',
        'private military contractor', 'black ops specialist'
    ];

    const currentJobs = [
        'gas station attendant', 'grocery store clerk', 'auto mechanic',
        'bartender', 'taxi driver', 'bouncer at a local club',
        'fishing boat captain', 'martial arts instructor'
    ];

    const plotTriggers = [
        'his daughter is kidnapped', 'his brother is murdered',
        'an old enemy resurfaces', 'he witnesses a brutal crime',
        'he\'s framed for a crime he didn\'t commit', 'his peaceful town is threatened',
        'his hidden past is exposed', 'a mysterious package is delivered to him'
    ];

    const villains = [
        'a ruthless drug lord', 'his former mentor turned arms dealer',
        'corrupt government officials', 'a tech billionaire with mind-control technology',
        'twin assassins with martial arts skills', 'a criminal mastermind',
        'an international terrorist organization', 'a sadistic crime family'
    ];

    const villainGroups = [
        'the Russian Mob', 'the Yakuza', 'the Triads',
        'Eastern European gangsters', 'rogue intelligence operatives',
        'private military contractors', 'a secret society of assassins'
    ];

    const sidekicks = [
        'a genius hacker', 'a reluctant rookie cop',
        'an undercover agent', 'a witty getaway driver',
        'a skilled martial artist', 'an arms dealer',
        'his estranged ex-partner', 'a reformed criminal'
    ];

    const plotTwists = [
        'he discovers he has only 24 hours to live',
        'his supposedly dead wife is behind everything',
        'the mission is a cover for a larger conspiracy',
        'his sidekick betrays him at the crucial moment',
        'the villain is his biological sibling',
        'he\'s been used as a pawn in a government experiment',
        'he\'s actually the villain\'s clone',
        'everything was orchestrated by his commanding officer'
    ];

    const vehicles = [
        'a modified muscle car', 'a military-grade motorcycle',
        'a stealth helicopter', 'an armored truck',
        'a souped-up sports car', 'a weaponized jet ski',
        'an experimental hovercraft', 'a vintage Aston Martin'
    ];

    const weapons = [
        'dual pistols with custom ammunition', 'a prototype energy weapon',
        'his bare hands and martial arts skills', 'everyday items turned into weapons',
        'a high-tech multi-tool', 'a rare ancient weapon',
        'an experimental government firearm', 'a customized sniper rifle'
    ];

    const actionScenes = [
        'a brutal fight in a kitchen using cookware as weapons',
        'a high-speed chase through narrow city streets',
        'a shootout in an abandoned warehouse',
        'hand-to-hand combat on top of a moving train',
        'an explosive escape from a collapsing building',
        'an underwater battle with enemy divers'
    ];

    const villainHideouts = [
        'a luxurious nightclub', 'a fortified warehouse complex',
        'a private island mansion', 'a penthouse apartment',
        'an abandoned factory', 'an underground bunker',
        'a heavily guarded compound', 'a remote mountain fortress'
    ];

    const bossFights = [
        'a hand-to-hand fight on a helicopter pad during a storm',
        'a brutal showdown in a burning building',
        'a chase through a maze of shipping containers',
        'a final confrontation in a sacred temple',
        'a battle on the edge of a skyscraper',
        'a fight to the death in an industrial meat freezer'
    ];

    const bossKills = [
        'thrown into industrial machinery',
        'ejected from a plane at high altitude',
        'impaled on their own weapon',
        'crushed by falling debris',
        'drowned in a tank of water',
        'blown up by their own explosives'
    ];

    const cameos = [
        'Dwayne "The Rock" Johnson as a rival operative',
        'Vin Diesel as an old army buddy',
        'Tom Hardy as a mysterious informant',
        'Ryan Reynolds as a chatty weapons dealer',
        'Charlize Theron as a deadly assassin',
        'Michelle Rodriguez as a street-racing contact'
    ];

    const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const includeCameo = () => Math.random() > 0.7; // 30% chance of a cameo

    useEffect(() => {
        return () => {
            if (trailerAudioUrl) {
                URL.revokeObjectURL(trailerAudioUrl);
            }
        };
    }, [trailerAudioUrl]);

    useEffect(() => {
        if (studioMode && !plot) {
            generatePlot();
        }
    }, [studioMode]);

    useEffect(() => {
        if (audioRef.current) {
            const audioElement = audioRef.current;

            const handleEnded = () => {
                setIsPlayingAudio(false);
            };

            const handlePlay = () => {
                setIsPlayingAudio(true);
            };

            const handlePause = () => {
                setIsPlayingAudio(false);
            };

            audioElement.addEventListener('ended', handleEnded);
            audioElement.addEventListener('play', handlePlay);
            audioElement.addEventListener('pause', handlePause);

            return () => {
                audioElement.removeEventListener('ended', handleEnded);
                audioElement.removeEventListener('play', handlePlay);
                audioElement.removeEventListener('pause', handlePause);
            };
        }
    }, [audioRef.current]);

    const generateAudio = async (trailerText) => {
        if (!openaiEnabled || !trailerText) return;

        setIsGeneratingAudio(true);
        try {
            const audioUrl = await generateTrailerAudio(trailerText);
            if (audioUrl) {
                setTrailerAudioUrl(audioUrl);

                if (audioRef.current) {
                    setTimeout(() => {
                        audioRef.current.play()
                            .catch(err => console.error('Failed to auto-play audio:', err));
                    }, 500);
                }
            }
        } catch (error) {
            console.error('Failed to generate audio:', error);
        } finally {
            setIsGeneratingAudio(false);
        }
    };

    const generateOpenAIContent = async (plotElements) => {
        if (!openaiEnabled || !useAI) return;

        try {
            const aiPlot = await generateMoviePlot(plotElements);
            if (aiPlot) {
                setAiGeneratedPlot(aiPlot);
            }

            const aiTrailer = await generateMovieTrailer(plotElements);
            if (aiTrailer) {
                setAiGeneratedTrailer(aiTrailer);

                if (trailerMode) {
                    generateAudio(aiTrailer);
                }
            }
        } catch (error) {
            console.error('Error generating OpenAI content:', error);
        }
    };

    const generatePlot = async () => {
        setLoading(true);
        setTrailerAudioUrl('');

        const hasCameo = includeCameo();
        const plotElements = {
            title: random(titles),
            setting: random(settings),
            formerProfession: random(formerProfessions),
            currentJob: random(currentJobs),
            plotTrigger: random(plotTriggers),
            villain: random(villains),
            villainGroup: random(villainGroups),
            sidekick: random(sidekicks),
            plotTwist: random(plotTwists),
            vehicle: random(vehicles),
            weapon: random(weapons),
            actionScene: random(actionScenes),
            villainHideout: random(villainHideouts),
            bossFight: random(bossFights),
            bossKill: hardcoreMode ? random(bossKills) : "defeated in an epic showdown",
            hasCameo,
            cameo: hasCameo ? random(cameos) : ''
        };

        if (openaiEnabled && useAI) {
            try {
                const aiPlot = await generateMoviePlot(plotElements);
                const aiTrailer = await generateMovieTrailer(plotElements);

                if (aiPlot) {
                    const fullPlot = {
                        ...plotElements,
                        summary: aiPlot,
                        trailer: aiTrailer || ''
                    };

                    setPlot(fullPlot);
                    setAiGeneratedPlot(aiPlot);

                    if (aiTrailer) {
                        setAiGeneratedTrailer(aiTrailer);
                        if (trailerMode) {
                            generateAudio(aiTrailer);
                        }
                    }

                    if (onPlotGenerated) {
                        onPlotGenerated(fullPlot);
                    }
                } else {
                    createBasicPlot(plotElements);
                }
            } catch (error) {
                console.error('Error generating AI plot:', error);
                createBasicPlot(plotElements);
            }
        } else {
            createBasicPlot(plotElements);
        }

        setLoading(false);
    };

    const createBasicPlot = (plotElements) => {
        setPlot(plotElements);

        if (onPlotGenerated) {
            onPlotGenerated(plotElements);
        }

        if (openaiEnabled && useAI) {
            generateOpenAIContent(plotElements);
        }
    };

    const toggleAudio = () => {
        if (!audioRef.current) return;

        if (audioRef.current.paused) {
            audioRef.current.play()
                .catch(err => console.error('Failed to play audio:', err));
        } else {
            audioRef.current.pause();
        }
    };

    const getPlotText = () => {
        if (!plot) return "";

        if (openaiEnabled && useAI) {
            if (trailerMode && aiGeneratedTrailer) {
                return aiGeneratedTrailer;
            } else if (!trailerMode && aiGeneratedPlot) {
                return aiGeneratedPlot;
            }
        }

        const standardPlot = `
            In this action-packed thriller, Jason Statham plays a former ${plot.formerProfession} who now works as a ${plot.currentJob} trying to live a quiet life. But when ${plot.plotTrigger}, he's forced back into action.

            Navigating ${plot.setting} to take down ${plot.villain} and ${plot.villainGroup}, he's aided by ${plot.sidekick}. Together they uncover a conspiracy that goes deeper than anyone imagined.

            The action explodes with ${plot.actionScene}. Racing against time using ${plot.vehicle} and armed with ${plot.weapon}, Statham infiltrates ${plot.villainHideout} for a final confrontation.

            ${plot.hasCameo ? `Watch for a special appearance by ${plot.cameo}.` : ''}

            Just when success seems within reach, ${plot.plotTwist}, forcing Statham into ${plot.bossFight} where the main villain is ${plot.bossKill}.
        `;

        const trailerPlot = `
            [DEEP VOICE]

            In a world where danger lurks around every corner...

            [PAUSE]

            One man stands between chaos and order.

            [TENSION BUILDING MUSIC]

            Jason Statham is a former ${plot.formerProfession}...

            "I thought I left that life behind."

            Now working as a ${plot.currentJob}, until...

            [DRAMATIC SOUND EFFECT]

            ${plot.plotTrigger.charAt(0).toUpperCase() + plot.plotTrigger.slice(1)}.

            [QUICK CUTS OF ACTION]

            "They've taken EVERYTHING from me. Now I'll take EVERYTHING from them."

            [MUSIC INTENSIFIES]

            In ${plot.setting}, he'll confront ${plot.villain}...

            "Did you really think you could escape your past?"

            ...and take down ${plot.villainGroup}.

            [EXPLOSION SOUND]

            Witness ${plot.actionScene}...

            Armed with ${plot.weapon}...

            ${plot.hasCameo ? `\nSpecial appearance by ${plot.cameo}...\n` : ''}

            But when ${plot.plotTwist}...

            [DRAMATIC PAUSE]

            "This ends NOW."

            [MUSIC CLIMAX]

            ${plot.title.toUpperCase()}

            Vengeance has a name.

            [IN THEATERS THIS SUMMER]
        `;

        return trailerMode ? trailerPlot : standardPlot;
    };

    const formatTrailerText = (text) => {
        if (!text) return [];

        return text.split('\n').map((line, i) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return <br key={i} />;

            if (/^\[.*\]$/.test(trimmedLine)) {
                return <p key={i} className="trailer-direction">{trimmedLine}</p>;
            } else if (trimmedLine.startsWith('"') && trimmedLine.endsWith('"')) {
                return <p key={i} className="trailer-dialogue">"{trimmedLine.slice(1, -1)}"</p>;
            } else if (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 3) {
                return <p key={i} className="trailer-emphasis">{trimmedLine}</p>;
            } else {
                return <p key={i} className="trailer-narration">{trimmedLine}</p>;
            }
        });
    };

    return (
        <div className="movie-plot">
            {!plot ? (
                <div>
                    {!studioMode && <p>Click the button to generate a Jason Statham movie!</p>}
                    <div className="options">
                        <label>
                            <input
                                type="checkbox"
                                checked={trailerMode}
                                onChange={() => setTrailerMode(!trailerMode)}
                            />
                            Trailer Voice Mode
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                checked={hardcoreMode}
                                onChange={() => setHardcoreMode(!hardcoreMode)}
                            />
                            Hardcore Mode
                        </label>
                        {openaiEnabled && (
                            <label>
                                <input
                                    type="checkbox"
                                    checked={useAI}
                                    onChange={() => setUseAI(!useAI)}
                                />
                                Use AI Enhancement
                            </label>
                        )}
                    </div>
                    <button
                        className="generate-btn"
                        onClick={generatePlot}
                        disabled={loading}
                    >
                        {loading ? 'Generating...' : studioMode ? 'Generate' : 'Generate Movie'}
                    </button>
                </div>
            ) : (
                <div>
                    <div className="plot-container">
                        <h2>{plot.title}</h2>

                        {trailerMode && (
                            <div className="audio-player">
                                {trailerAudioUrl ? (
                                    <>
                                        <audio
                                            ref={audioRef}
                                            src={trailerAudioUrl}
                                            onEnded={() => setIsPlayingAudio(false)}
                                        />
                                        <button
                                            className={`audio-btn ${isPlayingAudio ? 'playing' : ''}`}
                                            onClick={toggleAudio}
                                            disabled={isGeneratingAudio}
                                        >
                                            {isGeneratingAudio ? 'Generating Audio...' : isPlayingAudio ? '⏸️ Pause' : '▶️ Play Trailer Voice'}
                                        </button>
                                    </>
                                ) : (
                                    <div className="audio-generating">
                                        {isGeneratingAudio ? (
                                            <p className="generating-message">
                                                <span className="loading-spinner"></span>
                                                Creating trailer voice audio...
                                            </p>
                                        ) : openaiEnabled && useAI ? (
                                            <button
                                                className="audio-btn"
                                                onClick={() => generateAudio(aiGeneratedTrailer || getPlotText())}
                                            >
                                                🎙️ Generate Trailer Voice
                                            </button>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className={trailerMode ? 'trailer-text' : 'plot-text'}>
                            {trailerMode ? (
                                <div className="trailer-script">
                                    {formatTrailerText(getPlotText())}
                                </div>
                            ) : (
                                getPlotText().split('\n').map((text, index) => (
                                    <p key={index}>{text.trim()}</p>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="options">
                        <label>
                            <input
                                type="checkbox"
                                checked={trailerMode}
                                onChange={() => {
                                    const wasTrailerMode = trailerMode;
                                    setTrailerMode(!trailerMode);
                                    if (!wasTrailerMode && openaiEnabled && useAI && !trailerAudioUrl) {
                                        const trailerText = aiGeneratedTrailer || getPlotText();
                                        generateAudio(trailerText);
                                    }
                                }}
                            />
                            Trailer Voice Mode
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                checked={hardcoreMode}
                                onChange={() => setHardcoreMode(!hardcoreMode)}
                            />
                            Hardcore Mode
                        </label>
                        {openaiEnabled && (
                            <label>
                                <input
                                    type="checkbox"
                                    checked={useAI}
                                    onChange={() => setUseAI(!useAI)}
                                />
                                Use AI Enhancement
                            </label>
                        )}
                    </div>

                    {!studioMode && (
                        <button
                            className="generate-btn"
                            onClick={generatePlot}
                            disabled={loading}
                        >
                            {loading ? 'Generating...' : 'Generate New Movie'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default MoviePlot;
