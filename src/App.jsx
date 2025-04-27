import React, { useState } from 'react';
import MoviePlot from './components/MoviePlot.jsx';
import MoviePoster from './components/MoviePoster.jsx';
import MovieStudio from './components/MovieStudio.jsx';
import ApiKeyManager from './components/ApiKeyManager.jsx';
import './App.css';

function App() {
  const [plotData, setPlotData] = useState(null);
  const [activeTab, setActiveTab] = useState('generator'); // 'generator' or 'studio'
  const [openaiInitialized, setOpenaiInitialized] = useState(false);

  const handlePlotGenerated = (newPlotData) => {
    setPlotData(newPlotData);
  };

  const handleOpenAIInitialized = (success) => {
    setOpenaiInitialized(success);
  };

  return (
    <div className="app">
      <header>
        <h1>Jason Statham Movie Generator</h1>
        <p className="tagline">Generate a blockbuster movie starring the one and only Jason Statham!</p>

        <nav className="main-nav">
          <button
            className={`nav-btn ${activeTab === 'generator' ? 'active' : ''}`}
            onClick={() => setActiveTab('generator')}
          >
            Movie Generator
          </button>
          <button
            className={`nav-btn ${activeTab === 'studio' ? 'active' : ''}`}
            onClick={() => setActiveTab('studio')}
          >
            Movie Studio
          </button>
        </nav>
      </header>

      <main>
        <section className="api-key-section">
          <ApiKeyManager onInitialized={handleOpenAIInitialized} />
        </section>

        {activeTab === 'generator' ? (
          <div className="generator-mode">
            <MoviePlot
              onPlotGenerated={handlePlotGenerated}
              openaiEnabled={openaiInitialized}
            />
            <MoviePoster
              plot={plotData}
              openaiEnabled={openaiInitialized}
            />
          </div>
        ) : (
          <div className="studio-mode">
            <MovieStudio openaiEnabled={openaiInitialized} />
          </div>
        )}
      </main>

      <footer>
        <p>© {new Date().getFullYear()} Statham Generator | Not affiliated with Jason Statham</p>
        {openaiInitialized && (
          <p className="ai-badge">Enhanced with OpenAI</p>
        )}
      </footer>
    </div>
  );
}

export default App;
