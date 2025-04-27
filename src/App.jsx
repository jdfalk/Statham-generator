import React from 'react';
import MoviePlot from './components/MoviePlot.jsx';
import './App.css';

function App() {
  return (
    <div className="app">
      <header>
        <h1>Jason Statham Movie Generator</h1>
        <p className="tagline">Generate a blockbuster movie starring the one and only Jason Statham!</p>
      </header>

      <main>
        <MoviePlot />
      </main>

      <footer>
        <p>© {new Date().getFullYear()} Statham Generator | Not affiliated with Jason Statham</p>
      </footer>
    </div>
  );
}

export default App;
