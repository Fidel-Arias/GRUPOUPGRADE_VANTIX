import React from 'react';
import { Search, Bell, Grid, Sun, Command, HelpCircle } from 'lucide-react';

const Header = () => {
  return (
    <header className="main-header">
      <div className="search-section">
        <div className="search-box">
          <Search size={16} className="search-ico" />
          <input type="text" placeholder="Buscar empleados, reportes o clientes..." />
          <div class="search-kbd">
            <Command size={10} />
            <span>K</span>
          </div>
        </div>
      </div>

      <div className="actions-section">
        <div class="nav-icons">
          <button className="nav-btn" title="Ayuda">
            <HelpCircle size={20} strokeWidth={1.5} />
          </button>
          <button className="nav-btn has-notif" title="Notificaciones">
            <Bell size={20} strokeWidth={1.5} />
            <span className="notif-ping"></span>
          </button>
          <button className="nav-btn" title="Aplicaciones">
            <Grid size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className="sep"></div>

        <button className="theme-toggle-btn">
          <Sun size={18} />
        </button>
      </div>

      <style jsx>{`
        .main-header {
          height: var(--header-height);
          padding: 0 2rem 0 5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-light);
          position: sticky;
          top: 0;
          z-index: 900;
          transition: var(--transition);
        }

        .search-section {
          flex: 1;
          display: flex;
          max-width: 500px;
        }

        .search-box {
          width: 100%;
          background: #f8fafc;
          border: 1px solid var(--border-subtle);
          border-radius: 14px;
          display: flex;
          align-items: center;
          padding: 0 1rem;
          height: 44px;
          transition: var(--transition);
        }

        .search-box:focus-within {
          background: white;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px var(--primary-soft);
          transform: translateY(-1px);
        }

        .search-ico {
          color: var(--text-muted);
          margin-right: 12px;
        }

        .search-box input {
          background: none;
          border: none;
          outline: none;
          flex: 1;
          font-size: 0.9rem;
          color: var(--text-heading);
          font-weight: 500;
          font-family: inherit;
        }

        .search-kbd {
          display: flex;
          align-items: center;
          gap: 3px;
          background: white;
          border: 1px solid var(--border-subtle);
          padding: 4px 8px;
          border-radius: 8px;
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 700;
          box-shadow: var(--shadow-sm);
        }

        .actions-section {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .nav-icons {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-btn {
          background: none;
          border: none;
          color: var(--text-body);
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          transition: var(--transition);
        }

        .nav-btn:hover {
          background: #f1f5f9;
          color: var(--primary);
          transform: translateY(-2px);
        }

        .notif-ping {
          position: absolute;
          top: 11px;
          right: 11px;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          border: 2px solid white;
        }

        .sep {
          width: 1px;
          height: 24px;
          background: var(--border-subtle);
        }

        .theme-toggle-btn {
          background: white;
          border: 1px solid var(--border-subtle);
          color: var(--text-heading);
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: var(--shadow-sm);
          transition: var(--transition);
        }

        .theme-toggle-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.1);
        }

        @media (min-width: 1024px) {
          .main-header { padding-left: 2rem; }
        }

        @media (max-width: 768px) {
          .search-section { display: none; }
        }
      `}</style>
    </header>
  );
};

export default Header;
