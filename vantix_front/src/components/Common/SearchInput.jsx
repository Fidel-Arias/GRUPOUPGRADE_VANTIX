import React from 'react';
import { Search } from 'lucide-react';

const SearchInput = ({ value, onChange, placeholder = 'Buscar...', className = '' }) => {
    return (
        <div className={`search-container ${className}`}>
            <Search size={18} className="search-icon" />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
            />
            <style jsx>{`
        .search-container {
          display: flex;
          align-items: center;
          background: var(--bg-app);
          border: 1px solid var(--border-subtle);
          border-radius: 14px;
          padding: 0 1.25rem;
          height: 46px;
          transition: all 0.3s;
          width: 100%;
          max-width: 400px;
        }

        .search-container:focus-within {
          border-color: var(--primary);
          background: var(--bg-panel);
          box-shadow: 0 0 0 4px var(--primary-glow);
        }

        .search-icon {
          color: var(--text-muted);
          margin-right: 12px;
          flex-shrink: 0;
        }

        input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 0.95rem;
          color: var(--text-heading);
          font-family: inherit;
        }

        input::placeholder {
          color: var(--text-muted);
          opacity: 0.7;
        }
      `}</style>
        </div>
    );
};

export default SearchInput;
