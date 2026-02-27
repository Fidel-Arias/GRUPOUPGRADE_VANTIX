import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const AlertModal = ({ isOpen, onClose, title, message, type = 'info' }) => {
    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle2 size={32} />;
            case 'warning': return <AlertCircle size={32} />;
            case 'error': return <AlertCircle size={32} />;
            default: return <Info size={32} />;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="alert-root">
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
                        className="alert-card"
                    >
                        <button className="close-btn" onClick={onClose}><X size={20} /></button>

                        <div className={`icon-box ${type}`}>
                            {getIcon()}
                        </div>
                        <h3>{title}</h3>
                        <p>{message}</p>

                        <button className={`btn-action ${type}`} onClick={onClose}>
                            Entendido
                        </button>

                        <style jsx>{`
                            .alert-root {
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
                                background: rgba(15, 23, 42, 0.6);
                                backdrop-filter: blur(4px);
                            }
                            .alert-card {
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
                            .close-btn {
                                position: absolute;
                                top: 1rem;
                                right: 1rem;
                                background: transparent;
                                border: none;
                                color: var(--text-muted);
                                cursor: pointer;
                                padding: 0.5rem;
                                border-radius: 50%;
                                transition: 0.2s;
                            }
                            .close-btn:hover { background: var(--bg-app); color: var(--text-heading); }

                            .icon-box {
                                width: 64px;
                                height: 64px;
                                border-radius: 20px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                margin-bottom: 0.5rem;
                            }
                            .icon-box.info { background: #eff6ff; color: #3b82f6; }
                            .icon-box.success { background: #ecfdf5; color: #10b981; }
                            .icon-box.warning { background: #fffbeb; color: #f59e0b; }
                            .icon-box.error { background: #fef2f2; color: #ef4444; }
                            
                            h3 { font-size: 1.4rem; font-weight: 800; color: var(--text-heading); margin: 0; }
                            p { font-size: 0.95rem; color: var(--text-muted); line-height: 1.6; margin: 0; }
                            
                            .btn-action {
                                margin-top: 1rem;
                                padding: 0.8rem 2rem;
                                border-radius: 12px;
                                border: none;
                                color: white;
                                font-weight: 700;
                                cursor: pointer;
                                transition: all 0.2s;
                                width: 100%;
                            }
                            .btn-action.info { background: #3b82f6; }
                            .btn-action.success { background: #10b981; }
                            .btn-action.warning { background: #f59e0b; }
                            .btn-action.error { background: #ef4444; }
                            
                            .btn-action:hover { transform: translateY(-2px); filter: brightness(1.1); }
                        `}</style>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AlertModal;
