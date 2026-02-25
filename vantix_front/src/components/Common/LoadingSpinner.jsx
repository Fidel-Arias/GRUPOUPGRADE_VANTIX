import React from 'react';

const LoadingSpinner = ({ message = 'Cargando datos...', fullPage = false }) => {
    return (
        <div className={`spinner-container ${fullPage ? 'full' : ''}`}>
            <div className="spinner"></div>
            {message && <p>{message}</p>}
            <style jsx>{`
        .spinner-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          gap: 1.5rem;
          color: var(--text-muted);
        }

        .full {
          position: fixed;
          inset: 0;
          background: var(--bg-app);
          z-index: 9999;
          padding: 0;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--border-subtle);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        p {
          font-weight: 600;
          font-size: 0.95rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default LoadingSpinner;
