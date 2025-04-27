import React, { useState } from 'react';

function MoviePlot() {
    const [plot, setPlot] = useState(null);

    const titles = [
        'Adrenaline Rush', 'Death Race', 'The Transporter: Final Run',
        'Crank: Ultimate Surge', 'The Mechanic Returns', 'Fast Vengeance',
        'Blitz Force', 'Chaos Redemption', 'Expendable Hero', 'Raw Justice'
    ];

    const settings = [
        'post-apocalyptic London', 'underground fight club in Bangkok',
        'high-speed train across Europe', 'skyscraper in Dubai',
        'secret government facility', 'luxury yacht in the Mediterranean'
    ];

    const villains = [
        'a ruthless drug lord', 'his former mentor turned arms dealer',
        'corrupt government officials', 'a tech billionaire with mind-control technology',
        'twin assassins with martial arts skills', 'a criminal mastermind'
    ];

    const sidekicks = [
        'a genius hacker', 'a reluctant rookie cop',
        'an undercover agent', 'a witty getaway driver',
        'a skilled martial artist', 'an arms dealer'
    ];

    const plotTwists = [
        'he discovers he has only 24 hours to live',
        'his supposedly dead wife is behind everything',
        'the mission is a cover for a larger conspiracy',
        'his sidekick betrays him at the crucial moment',
        'the villain is his biological sibling'
    ];

    const vehicles = [
        'a modified muscle car', 'a military-grade motorcycle',
        'a stealth helicopter', 'an armored truck',
        'a souped-up sports car', 'a weaponized jet ski'
    ];

    const weapons = [
        'dual pistols with custom ammunition', 'a prototype energy weapon',
        'his bare hands and martial arts skills', 'everyday items turned into weapons',
        'a high-tech multi-tool', 'a rare ancient weapon'
    ];

    const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const generatePlot = () => {
        setPlot({
            title: random(titles),
            setting: random(settings),
            villain: random(villains),
            sidekick: random(sidekicks),
            plotTwist: random(plotTwists),
            vehicle: random(vehicles),
            weapon: random(weapons)
        });
    };

    return (
        <div className="movie-plot">
            {!plot ? (
                <div>
                    <p>Click the button to generate a Jason Statham movie!</p>
                    <button className="generate-btn" onClick={generatePlot}>Generate Movie</button>
                </div>
            ) : (
                <div>
                    <div className="plot-container">
                        <h2>{plot.title}</h2>
                        <p>
                            In this action-packed thriller, Jason Statham plays a former elite operative who must navigate
                            <strong> {plot.setting}</strong> to take down <strong>{plot.villain}</strong>.
                            Aided by <strong>{plot.sidekick}</strong>, he races against time using
                            <strong> {plot.vehicle}</strong> and armed with <strong>{plot.weapon}</strong>.
                        </p>
                        <p>
                            Just when success seems within reach, <strong>{plot.plotTwist}</strong>, forcing him
                            to push beyond his limits to save the day.
                        </p>
                    </div>
                    <button className="generate-btn" onClick={generatePlot}>Generate New Movie</button>
                </div>
            )}
        </div>
    );
}

export default MoviePlot;
