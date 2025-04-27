import React, { useState } from 'react';
import MoviePlot from './MoviePlot';

function MovieStudio({ openaiEnabled }) {
    const [movieCount, setMovieCount] = useState(3);
    const [movies, setMovies] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);

    // Generate multiple movies at once
    const generateMovies = async () => {
        setIsGenerating(true);

        // Create an array of the requested number of movies
        const newMovies = Array(movieCount).fill().map((_, index) => ({
            id: Date.now() + index,
            generated: false,
            plot: null
        }));

        setMovies(newMovies);
        setIsGenerating(false);
    };

    // Handle when a movie plot is generated
    const handlePlotGenerated = (index, plotData) => {
        setMovies(prevMovies => {
            const updatedMovies = [...prevMovies];
            updatedMovies[index] = {
                ...updatedMovies[index],
                generated: true,
                plot: plotData
            };
            return updatedMovies;
        });
    };

    return (
        <div className="movie-studio">
            <h2>Movie Studio Mode</h2>
            <p>Generate multiple Jason Statham movies at once!</p>

            <div className="studio-controls">
                <label>
                    Number of Movies:
                    <input
                        type="number"
                        min="1"
                        max="5"
                        value={movieCount}
                        onChange={(e) => setMovieCount(parseInt(e.target.value))}
                        disabled={isGenerating || movies.length > 0}
                    />
                </label>

                {movies.length === 0 ? (
                    <button
                        className="studio-btn"
                        onClick={generateMovies}
                        disabled={isGenerating}
                    >
                        {isGenerating ? 'Generating...' : 'Start Production'}
                    </button>
                ) : (
                    <button
                        className="studio-btn"
                        onClick={() => setMovies([])}
                    >
                        New Batch
                    </button>
                )}
            </div>

            {movies.length > 0 && (
                <div className="movie-grid">
                    {movies.map((movie, index) => (
                        <div key={movie.id} className="movie-grid-item">
                            <h3>Movie #{index + 1}</h3>
                            <MoviePlot
                                studioMode={true}
                                openaiEnabled={openaiEnabled}
                                onPlotGenerated={(plotData) => handlePlotGenerated(index, plotData)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MovieStudio;
