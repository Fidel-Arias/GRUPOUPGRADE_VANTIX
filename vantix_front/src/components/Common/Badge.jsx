import React from 'react';

const Badge = ({ children, variant = 'default', className = '', icon: Icon }) => {
    return (
        <div className={`badge-root ${variant} ${className}`}>
            {Icon && <Icon size={12} />}
            <span>{children}</span>
            <style jsx>{`
        .badge-root {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 30px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }
        
        /* Variants */
        .default { background: var(--bg-app); color: var(--text-muted); border: 1px solid var(--border-subtle); }
        .primary { background: var(--primary-soft); color: var(--primary); }
        .success { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
        .warning { background: rgba(234, 179, 8, 0.1); color: #eab308; }
        .danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .info { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .admin { background: #fef2f2; color: #ef4444; border: 1px solid #fee2e2; }
        
        :global(.dark) .admin {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.2);
        }
      `}</style>
        </div>
    );
};

export default Badge;
