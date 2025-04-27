import React, { useState } from 'react';
import MoviePlot from './components/MoviePlot.jsx';
import MoviePoster from './components/MoviePoster.jsx';
import './App.css';

function App() {
  const [plotData, setPlotData] = useState(null);

  const handlePlotGenerated = (newPlotData) => {
    setPlotData(newPlotData);
  };

  return (
    <div className="app">
      <header>
        <h1>Jason Statham Movie Generator</h1>
        <p className="tagline">Generate a blockbuster movie starring the one and only Jason Statham!</p>
      </header>

      <main>
        <MoviePlot onPlotGenerated={handlePlotGenerated} />
        <MoviePoster plot={plotData} />
      </main>

      <footer>
        <p>© {new Date().getFullYear()} Statham Generator | Not affiliated with Jason Statham</p>
      </footer>
    </div>
  );
}

export default App;
