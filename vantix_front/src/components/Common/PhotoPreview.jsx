import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const PhotoPreview = ({ url, isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && url && (
                <div className="preview-root">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="overlay"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className="close-btn" onClick={onClose}>
                            <X size={24} />
                        </button>
                        <img src={url} alt="Vista previa" />

                        <style jsx>{`
              .preview-root {
                position: fixed;
                inset: 0;
                z-index: 6000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2rem;
              }
              .overlay {
                position: absolute;
                inset: 0;
                background: rgba(15, 23, 42, 0.9);
                backdrop-filter: blur(10px);
              }
              .content {
                position: relative;
                max-width: 90vw;
                max-height: 90vh;
                background: var(--bg-panel);
                border-radius: 24px;
                overflow: hidden;
                box-shadow: var(--shadow-2xl);
              }
              img {
                width: 100%;
                height: auto;
                max-height: 90vh;
                display: block;
                object-fit: contain;
              }
              .close-btn {
                position: absolute;
                top: 1.5rem;
                right: 1.5rem;
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: var(--bg-panel);
                border: 1px solid var(--border-subtle);
                color: var(--text-heading);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: var(--shadow-lg);
                z-index: 10;
                transition: all 0.2s;
              }
              .close-btn:hover {
                transform: rotate(90deg) scale(1.1);
                color: var(--primary);
              }
            `}</style>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default PhotoPreview;
