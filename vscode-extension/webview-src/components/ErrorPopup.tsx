import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface ErrorPopupProps {
  message: string;
  details?: string;
  onClose: () => void;
  onRetry?: () => void;
}

export const ErrorPopup: React.FC<ErrorPopupProps> = ({
  message,
  details,
  onClose,
  onRetry,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Modal isOpen={true} onClose={onClose} title="Error">
      <div className="error-popup-content">
        <div className="error-message-container">
          <div className="error-icon-wrapper">
            <span className="error-icon-large">⚠️</span>
          </div>
          <p className="error-message-text">{message}</p>
        </div>
        
        {details && (
          <div className="error-details-section">
            <button 
              type="button"
              className="toggle-details-btn"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details ▲' : 'Show Details ▼'}
            </button>
            {showDetails && (
              <div className="error-details-box">
                <pre className="error-details-code">
                  {details}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="error-actions">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {onRetry && (
            <Button variant="primary" onClick={onRetry}>
              Retry
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
