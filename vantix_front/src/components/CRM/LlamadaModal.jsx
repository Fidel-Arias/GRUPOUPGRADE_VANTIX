import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    PhoneCall,
    User,
    Clock,
    CheckCircle,
    ClipboardList,
    MessageSquare,
    Phone
} from 'lucide-react';
import { planService } from '../../services/api';

const LlamadaModal = ({ isOpen, onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [planes, setPlanes] = useState([]);
    const [formData, setFormData] = useState({
        id_plan: '',
        numero_destino: '',
        nombre_destinatario: '',
        duracion_segundos: '',
        resultado: 'Contestó',
        notas_llamada: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchPlanes();
            setFormData({
                id_plan: '',
                numero_destino: '',
                nombre_destinatario: '',
                duracion_segundos: '',
                resultado: 'Contestó',
                notas_llamada: ''
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
                        <div className="icon-box"><PhoneCall size={20} /></div>
                        <div>
                            <h3>Registrar Llamada</h3>
                            <p>Registro manual de gestión telefónica.</p>
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

                        <div className="form-group">
                            <label>Número de Destino</label>
                            <div className="input-with-icon">
                                <Phone size={18} />
                                <input
                                    type="tel"
                                    placeholder="912 345 678"
                                    value={formData.numero_destino}
                                    onChange={(e) => setFormData({ ...formData, numero_destino: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Nombre Cliente / Contacto</label>
                            <div className="input-with-icon">
                                <User size={18} />
                                <input
                                    type="text"
                                    placeholder="Nombre del cliente..."
                                    value={formData.nombre_destinatario}
                                    onChange={(e) => setFormData({ ...formData, nombre_destinatario: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Duración (segundos)</label>
                            <div className="input-with-icon">
                                <Clock size={18} />
                                <input
                                    type="number"
                                    placeholder="Ej: 120"
                                    value={formData.duracion_segundos}
                                    onChange={(e) => setFormData({ ...formData, duracion_segundos: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Resultado</label>
                            <div className="input-with-icon">
                                <CheckCircle size={18} />
                                <select
                                    value={formData.resultado}
                                    onChange={(e) => setFormData({ ...formData, resultado: e.target.value })}
                                >
                                    <option value="Contestó">Contestó</option>
                                    <option value="Buzón de voz">Buzón de voz</option>
                                    <option value="No contestó">No contestó</option>
                                    <option value="Número equivocado">Número equivocado</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group full">
                            <label>Notas de la Llamada</label>
                            <textarea
                                placeholder="Escribe un breve resumen de lo conversado..."
                                value={formData.notas_llamada}
                                onChange={(e) => setFormData({ ...formData, notas_llamada: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? 'Guardando...' : 'Registrar Llamada'}
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
                    width: 100%; max-width: 550px; background: white; border-radius: 24px;
                    display: flex; flex-direction: column; overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
                }
                .modal-header {
                    padding: 1.5rem 2rem; border-bottom: 1px solid #f1f5f9;
                    display: flex; justify-content: space-between; align-items: center; background: #fafafa;
                }
                .title-wrap { display: flex; align-items: center; gap: 15px; }
                .icon-box {
                    width: 44px; height: 44px; background: #f0f9ff; color: #0ea5e9;
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

                textarea {
                    width: 100%; height: 80px; background: #f8fafc; border: 1.5px solid #e2e8f0;
                    border-radius: 12px; padding: 12px 1rem; font-family: inherit; font-size: 0.95rem;
                    color: #1e293b; outline: none; resize: none;
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

export default LlamadaModal;
