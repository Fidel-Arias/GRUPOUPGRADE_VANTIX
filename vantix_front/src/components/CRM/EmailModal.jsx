import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Mail,
    AtSign,
    Type,
    Send,
    ClipboardList,
    MessageSquare,
    Info
} from 'lucide-react';
import { planService } from '../../services/api';

const EmailModal = ({ isOpen, onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [planes, setPlanes] = useState([]);
    const [formData, setFormData] = useState({
        id_plan: '',
        email_destino: '',
        asunto: '',
        estado_envio: 'Enviado'
    });

    useEffect(() => {
        if (isOpen) {
            fetchPlanes();
            setFormData({
                id_plan: '',
                email_destino: '',
                asunto: '',
                estado_envio: 'Enviado'
            });
        }
    }, [isOpen]);

    const fetchPlanes = async () => {
        try {
            const data = await planService.getAll(0, 10);
            setPlanes(data);
            if (data.length > 0) {
                setFormData(prev => ({ ...prev, id_plan: data[0].id_plan }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="modal-card glass-morphism"
            >
                <div className="modal-header">
                    <div className="title-wrap">
                        <div className="icon-box"><Mail size={20} /></div>
                        <div>
                            <h3>Registrar Email</h3>
                            <p>Auditoría de correos electrónicos comerciales.</p>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-grid">
                        <div className="form-group full">
                            <label>Plan de Trabajo</label>
                            <div className="input-with-icon">
                                <ClipboardList size={18} />
                                <select
                                    value={formData.id_plan}
                                    onChange={(e) => setFormData({ ...formData, id_plan: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccione Plan...</option>
                                    {planes.map(p => (
                                        <option key={p.id_plan} value={p.id_plan}>
                                            Semana {p.fecha_inicio_semana} (#ID: {p.id_plan})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group full">
                            <label>Email de Destino</label>
                            <div className="input-with-icon">
                                <AtSign size={18} />
                                <input
                                    type="email"
                                    placeholder="cliente@empresa.com"
                                    value={formData.email_destino}
                                    onChange={(e) => setFormData({ ...formData, email_destino: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group full">
                            <label>Asunto del Correo</label>
                            <div className="input-with-icon">
                                <Type size={18} />
                                <input
                                    type="text"
                                    placeholder="Ej: Seguimiento de propuesta comercial"
                                    value={formData.asunto}
                                    onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group full">
                            <div className="info-badge">
                                <Info size={14} />
                                <span>El estado se marcará como "Enviado" automáticamente para auditoría.</span>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? 'Guardando...' : 'Registrar Email'}
                        </button>
                    </div>
                </form>
            </motion.div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed; inset: 0; background: rgba(15, 23, 42, 0.8);
                    backdrop-filter: blur(8px); display: flex; align-items: center;
                    justify-content: center; z-index: 2000; padding: 1.5rem;
                }
                .modal-card {
                    width: 100%; max-width: 500px; background: white; border-radius: 24px;
                    display: flex; flex-direction: column; overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
                }
                .modal-header {
                    padding: 1.5rem 2rem; border-bottom: 1px solid #f1f5f9;
                    display: flex; justify-content: space-between; align-items: center; background: #fafafa;
                }
                .title-wrap { display: flex; align-items: center; gap: 15px; }
                .icon-box {
                    width: 44px; height: 44px; background: #fdf2f8; color: #db2777;
                    border-radius: 12px; display: flex; align-items: center; justify-content: center;
                }
                .title-wrap h3 { font-size: 1.25rem; font-weight: 800; color: #1e293b; line-height: 1; margin-bottom: 4px; }
                .title-wrap p { font-size: 0.85rem; color: #64748b; font-weight: 500; }
                .close-btn { background: none; border: none; color: #94a3b8; cursor: pointer; }

                .modal-body { padding: 2rem; }
                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                .form-group.full { grid-column: span 2; }
                .form-group label { display: block; font-size: 0.8rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
                
                .input-with-icon {
                    position: relative; display: flex; align-items: center;
                    background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px;
                    height: 48px; transition: all 0.2s;
                }
                .input-with-icon svg { position: absolute; left: 14px; color: #94a3b8; }
                .input-with-icon input, .input-with-icon select {
                    width: 100%; height: 100%; background: none; border: none; padding: 0 1rem 0 44px;
                    font-size: 0.95rem; font-weight: 600; color: #1e293b; outline: none;
                }

                .info-badge {
                    display: flex; align-items: center; gap: 8px; background: #f0fdf4;
                    padding: 10px 1rem; border-radius: 10px; color: #166534; font-size: 0.75rem; font-weight: 600;
                }

                .modal-footer {
                    padding: 1.5rem 2rem; border-top: 1px solid #f1f5f9;
                    display: flex; justify-content: flex-end; gap: 12px; background: #fafafa;
                }
                .btn-cancel {
                    padding: 0.8rem 1.5rem; border-radius: 12px; border: 1px solid #e2e8f0;
                    background: white; color: #64748b; font-weight: 700; cursor: pointer;
                }
                .btn-save {
                    padding: 0.8rem 1.8rem; border-radius: 12px; border: none;
                    background: #0f172a; color: white; font-weight: 700; cursor: pointer;
                }
            `}</style>
        </div>
    );
};

export default EmailModal;
