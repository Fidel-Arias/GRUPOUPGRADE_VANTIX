import React from 'react';
import { motion } from 'framer-motion';

const EmptyState = ({ icon: Icon, title, message, actionLabel, onAction }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="empty-state-card"
        >
            {Icon && <div className="icon-box"><Icon size={48} /></div>}
            <h3>{title}</h3>
            <p>{message}</p>
            {actionLabel && (
                <button className="btn-primary" onClick={onAction}>
                    {actionLabel}
                </button>
            )}
            <style jsx>{`
        .empty-state-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 5rem 2rem;
          text-align: center;
          background: var(--bg-panel);
          border: 1px dashed var(--border-subtle);
          border-radius: 24px;
          color: var(--text-muted);
          width: 100%;
        }

        .icon-box {
          margin-bottom: 1.5rem;
          color: var(--primary-soft);
          opacity: 0.5;
        }

        h3 {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-heading);
          margin-bottom: 0.5rem;
        }

        p {
          font-size: 0.95rem;
          max-width: 300px;
          margin-bottom: 2rem;
          line-height: 1.5;
        }

        .btn-primary {
          background: var(--bg-sidebar);
          color: white;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
      `}</style>
        </motion.div>
    );
};

export default EmptyState;
