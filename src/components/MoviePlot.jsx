import React, { useState } from 'react';

function MoviePlot({ onPlotGenerated }) {
    const [plot, setPlot] = useState(null);
    const [trailerMode, setTrailerMode] = useState(false);
    const [hardcoreMode, setHardcoreMode] = useState(false);

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

    const generatePlot = () => {
        const hasCameo = includeCameo();
        const cameo = hasCameo ? random(cameos) : null;

        const newPlot = {
            title: random(titles),
            formerProfession: random(formerProfessions),
            currentJob: random(currentJobs),
            plotTrigger: random(plotTriggers),
            setting: random(settings),
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
            cameo: cameo,
            hasCameo: hasCameo
        };

        setPlot(newPlot);

        // Pass the plot data to the parent component
        if (onPlotGenerated) {
            onPlotGenerated(newPlot);
        }
    };

    const getPlotText = () => {
        if (!plot) return "";

        const standardPlot = `
            In this action-packed thriller, Jason Statham plays a former ${plot.formerProfession} who now works as a ${plot.currentJob} trying to live a quiet life. But when ${plot.plotTrigger}, he's forced back into action.

            Navigating ${plot.setting} to take down ${plot.villain} and ${plot.villainGroup}, he's aided by ${plot.sidekick}. Together they uncover a conspiracy that goes deeper than anyone imagined.

            The action explodes with ${plot.actionScene}. Racing against time using ${plot.vehicle} and armed with ${plot.weapon}, Statham infiltrates ${plot.villainHideout} for a final confrontation.

            ${plot.hasCameo ? `Watch for a special appearance by ${plot.cameo}.` : ''}

            Just when success seems within reach, ${plot.plotTwist}, forcing Statham into ${plot.bossFight} where the main villain is ${plot.bossKill}.
        `;

        const trailerPlot = `
            THIS SUMMER...

            One man. One mission. NO MERCY.

            Jason Statham is a former ${plot.formerProfession}...

            "I left that life behind."

            But when ${plot.plotTrigger}...

            "They've taken everything from me."

            THERE WILL BE VENGEANCE.

            "I'm not just coming for you. I'm coming for EVERYONE."

            In a world of betrayal...

            Armed with ${plot.weapon}...

            Witness ${plot.actionScene}...

            ${plot.hasCameo ? `WITH ${plot.cameo.toUpperCase()}` : ''}

            "${plot.plotTwist.toUpperCase()}!"

            JASON STATHAM

            ${plot.title.toUpperCase()}

            SUMMER ${new Date().getFullYear()}
        `;

        return trailerMode ? trailerPlot : standardPlot;
    };

    return (
        <div className="movie-plot">
            {!plot ? (
                <div>
                    <p>Click the button to generate a Jason Statham movie!</p>
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
                    </div>
                    <button className="generate-btn" onClick={generatePlot}>Generate Movie</button>
                </div>
            ) : (
                <div>
                    <div className="plot-container">
                        <h2>{plot.title}</h2>
                        <div className={trailerMode ? 'trailer-text' : 'plot-text'}>
                            {getPlotText().split('\n').map((text, index) => (
                                <p key={index}>{text.trim()}</p>
                            ))}
                        </div>
                    </div>
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
                    </div>
                    <button className="generate-btn" onClick={generatePlot}>Generate New Movie</button>
                </div>
            )}
        </div>
    );
}

export default MoviePlot;
