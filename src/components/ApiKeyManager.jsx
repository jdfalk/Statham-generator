import React, { useEffect } from 'react';
import { initializeOpenAI, isOpenAIInitialized } from '../services/openaiService';

/**
 * Component to manage API initialization
 * This is now a simpler component that automatically initializes the API
 * without requiring user input
 *
 * @param {Object} props - Component props
 * @param {Function} props.onInitialized - Callback when API is initialized
 * @returns {JSX.Element} - React component
 */
function ApiKeyManager({ onInitialized }) {
  // Initialize OpenAI on component mount
  useEffect(() => {
    const success = initializeOpenAI();
    onInitialized(success);
  }, [onInitialized]);

  return (
    <div className="api-key-manager">
      <div className="api-key-stored">
        <p>
          <span className="success-icon">✓</span> AI features are ready to use
        </p>
        <p className="api-info">
          This app uses AI to generate movie plots, trailers, and posters.
        </p>
      </div>
    </div>
  );
}

export default ApiKeyManager;
