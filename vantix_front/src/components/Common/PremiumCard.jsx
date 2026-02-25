import React from 'react';
import { motion } from 'framer-motion';

const PremiumCard = ({ children, className = '', hover = true, ...props }) => {
    return (
        <motion.div
            whileHover={hover ? { translateY: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' } : {}}
            className={`premium-card ${className}`}
            {...props}
        >
            {children}
            <style jsx>{`
        .premium-card {
          background: var(--bg-panel);
          border: 1px solid var(--border-subtle);
          border-radius: 20px;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        :global(.dark) .premium-card {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .premium-card:hover {
          border-color: var(--primary);
        }
      `}</style>
        </motion.div>
    );
};

export default PremiumCard;
