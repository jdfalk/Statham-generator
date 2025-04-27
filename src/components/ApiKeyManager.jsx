import React, { useState, useEffect } from 'react';
import { initOpenAI, isInitialized } from '../services/openaiService';

function ApiKeyManager({ onInitialized }) {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [keyStored, setKeyStored] = useState(false);

  // Check if API key is stored in localStorage
  useEffect(() => {
    const storedKey = localStorage.getItem('openai_api_key');
    if (storedKey) {
      initializeWithKey(storedKey);
    }
  }, []);

  // Initialize OpenAI with the provided API key
  const initializeWithKey = async (key) => {
    setIsLoading(true);
    setError('');

    try {
      const success = initOpenAI(key);
      if (success) {
        localStorage.setItem('openai_api_key', key);
        setKeyStored(true);
        onInitialized(true);
      } else {
        setError('Failed to initialize OpenAI client');
        onInitialized(false);
      }
    } catch (err) {
      setError('Error initializing OpenAI: ' + err.message);
      onInitialized(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }

    initializeWithKey(apiKey);
  };

  // Clear the stored API key
  const clearApiKey = () => {
    localStorage.removeItem('openai_api_key');
    setApiKey('');
    setKeyStored(false);
    onInitialized(false);
  };

  return (
    <div className="api-key-manager">
      {keyStored ? (
        <div className="api-key-stored">
          <p>
            <span className="success-icon">✓</span> OpenAI API key is stored and ready to use
          </p>
          <button
            className="clear-key-btn"
            onClick={clearApiKey}
            type="button"
          >
            Clear API Key
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <h3>Enter your OpenAI API Key</h3>
          <p className="api-key-info">
            Your API key is stored securely in your browser and never sent to our servers.
            <br />
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get your API key from OpenAI
            </a>
          </p>

          <div className="input-group">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="api-key-input"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="submit-key-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Connecting...' : 'Connect'}
            </button>
          </div>

          {error && <p className="error-message">{error}</p>}
        </form>
      )}
    </div>
  );
}

export default ApiKeyManager;
