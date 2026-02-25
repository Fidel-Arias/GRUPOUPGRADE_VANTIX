import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, type = 'danger' }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="confirm-root">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="overlay"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="confirm-card"
                    >
                        <div className={`icon-box ${type}`}>
                            <AlertCircle size={32} />
                        </div>
                        <h3>{title}</h3>
                        <p>{message}</p>
                        <div className="actions">
                            <button className="btn-secondary" onClick={onClose}>Cancelar</button>
                            <button className={`btn-confirm ${type}`} onClick={onConfirm}>Confirmar</button>
                        </div>

                        <style jsx>{`
              .confirm-root {
                position: fixed;
                inset: 0;
                z-index: 5000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1.5rem;
              }
              .overlay {
                position: absolute;
                inset: 0;
                background: rgba(15, 23, 42, 0.8);
                backdrop-filter: blur(8px);
              }
              .confirm-card {
                position: relative;
                background: var(--bg-panel);
                border: 1px solid var(--border-subtle);
                border-radius: 24px;
                padding: 2.5rem;
                max-width: 400px;
                width: 100%;
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1rem;
                box-shadow: var(--shadow-2xl);
              }
              .icon-box {
                width: 70px;
                height: 70px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 0.5rem;
              }
              .icon-box.danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
              .icon-box.warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
              
              h3 { font-size: 1.5rem; font-weight: 800; color: var(--text-heading); }
              p { font-size: 0.95rem; color: var(--text-muted); line-height: 1.6; }
              
              .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; width: 100%; margin-top: 1rem; }
              
              .btn-secondary {
                padding: 0.8rem; border-radius: 12px; border: 1px solid var(--border-subtle);
                background: var(--bg-app); color: var(--text-muted); font-weight: 700;
                cursor: pointer; transition: all 0.2s;
              }
              .btn-confirm {
                padding: 0.8rem; border-radius: 12px; border: none;
                color: white; font-weight: 700; cursor: pointer; transition: all 0.2s;
              }
              .btn-confirm.danger { background: #ef4444; }
              .btn-confirm.danger:hover { background: #dc2626; box-shadow: 0 10px 15px -3px rgba(220, 38, 38, 0.4); }
            `}</style>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;
