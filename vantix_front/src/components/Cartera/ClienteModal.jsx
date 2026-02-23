import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, CreditCard, MapPin, User, Phone, Mail, Save, AlertCircle, Info } from 'lucide-react';

const ClienteModal = ({ isOpen, onClose, onSave, cliente = null }) => {
    const [formData, setFormData] = useState({
        nombre_cliente: '',
        ruc_dni: '',
        categoria: 'CORPORATIVO',
        direccion: '',
        nombre_contacto: '',
        celular_contacto: '',
        email_contacto: '',
        observaciones: '',
        activo: true
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (cliente) {
            setFormData({
                nombre_cliente: cliente.nombre_cliente || '',
                ruc_dni: cliente.ruc_dni || '',
                categoria: cliente.categoria || 'CORPORATIVO',
                direccion: cliente.direccion || '',
                nombre_contacto: cliente.nombre_contacto || '',
                celular_contacto: cliente.celular_contacto || '',
                email_contacto: cliente.email_contacto || '',
                observaciones: cliente.observaciones || '',
                activo: cliente.activo ?? true
            });
        } else {
            setFormData({
                nombre_cliente: '',
                ruc_dni: '',
                categoria: 'CORPORATIVO',
                direccion: '',
                nombre_contacto: '',
                celular_contacto: '',
                email_contacto: '',
                observaciones: '',
                activo: true
            });
        }
        setError(null);
    }, [cliente, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await onSave(formData);
            onClose();
        } catch (err) {
            setError(err.message || 'Ocurrió un error al procesar la solicitud.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-root">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                        onClick={onClose}
                    />
                    <div className="modal-scroll-area">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="modal-container"
                        >
                            <div className="modal-header">
                                <div className="title-wrap">
                                    <div className="icon-badge">
                                        <Building2 size={20} />
                                    </div>
                                    <h3>{cliente ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
                                </div>
                                <button className="close-btn" onClick={onClose}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="modal-form">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="error-banner"
                                    >
                                        <AlertCircle size={16} />
                                        <span>{error}</span>
                                    </motion.div>
                                )}

                                <div className="form-grid">
                                    <div className="input-group full">
                                        <label><Building2 size={14} /> Nombre del Cliente / Razón Social</label>
                                        <input
                                            type="text"
                                            name="nombre_cliente"
                                            value={formData.nombre_cliente}
                                            onChange={handleChange}
                                            placeholder="Ej: Inversiones Vantix S.A.C."
                                            required
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label><CreditCard size={14} /> RUC / DNI</label>
                                        <input
                                            type="text"
                                            name="ruc_dni"
                                            value={formData.ruc_dni}
                                            onChange={handleChange}
                                            placeholder="11 u 8 dígitos"
                                            required
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label><Info size={14} /> Categoría</label>
                                        <select
                                            name="categoria"
                                            value={formData.categoria}
                                            onChange={handleChange}
                                        >
                                            <option value="CORPORATIVO">Corporativo</option>
                                            <option value="GOBIERNO">Gobierno</option>
                                            <option value="RETAIL">Retail</option>
                                        </select>
                                    </div>

                                    <div className="input-group full">
                                        <label><MapPin size={14} /> Dirección Fiscal / Oficina</label>
                                        <input
                                            type="text"
                                            name="direccion"
                                            value={formData.direccion}
                                            onChange={handleChange}
                                            placeholder="Calle, Av, Jr y Número"
                                        />
                                    </div>

                                    <div className="section-divider full">Contacto Principal</div>

                                    <div className="input-group">
                                        <label><User size={14} /> Persona de Contacto</label>
                                        <input
                                            type="text"
                                            name="nombre_contacto"
                                            value={formData.nombre_contacto}
                                            onChange={handleChange}
                                            placeholder="Persona de enlace"
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label><Phone size={14} /> Celular</label>
                                        <input
                                            type="text"
                                            name="celular_contacto"
                                            value={formData.celular_contacto}
                                            onChange={handleChange}
                                            placeholder="9 dígitos"
                                        />
                                    </div>

                                    <div className="input-group full">
                                        <label><Mail size={14} /> Correo Electrónico</label>
                                        <input
                                            type="email"
                                            name="email_contacto"
                                            value={formData.email_contacto}
                                            onChange={handleChange}
                                            placeholder="empresa@correo.com"
                                        />
                                    </div>

                                    <div className="input-group full">
                                        <label>Observaciones</label>
                                        <textarea
                                            name="observaciones"
                                            value={formData.observaciones}
                                            onChange={handleChange}
                                            placeholder="Notas adicionales sobre el cliente..."
                                            rows="3"
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="btn-cancel" onClick={onClose}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn-save" disabled={loading}>
                                        {loading ? (
                                            <div className="spinner-small"></div>
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                <span>{cliente ? 'Guardar Cambios' : 'Registrar Cliente'}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>

                    <style jsx>{`
            .modal-root {
              position: fixed;
              inset: 0;
              z-index: 2000;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .modal-overlay {
              position: fixed;
              inset: 0;
              background: rgba(15, 23, 42, 0.6);
              backdrop-filter: blur(8px);
            }

            .modal-scroll-area {
              position: relative;
              z-index: 2001;
              width: 100%;
              max-height: 100vh;
              overflow-y: auto;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 2rem;
            }

            .modal-container {
              width: 100%;
              max-width: 600px;
              background: white;
              border-radius: 24px;
              box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.25);
              overflow: hidden;
            }

            .modal-header {
              padding: 1.5rem 2rem;
              display: flex;
              justify-content: space-between;
              align-items: center;
              background: #f8fafc;
              border-bottom: 1px solid #f1f5f9;
            }

            .title-wrap {
              display: flex;
              align-items: center;
              gap: 12px;
            }

            .icon-badge {
              width: 36px;
              height: 36px;
              background: #f0f9ff;
              color: #0369a1;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .modal-header h3 {
              font-size: 1.25rem;
              font-weight: 800;
              color: #1e293b;
            }

            .close-btn {
              background: none;
              border: none;
              color: #94a3b8;
              cursor: pointer;
              padding: 8px;
              border-radius: 50%;
              transition: all 0.2s;
            }

            .close-btn:hover {
              background: #f1f5f9;
              color: #ef4444;
            }

            .modal-form {
              padding: 2rem;
            }

            .error-banner {
              background: #fef2f2;
              color: #dc2626;
              padding: 0.75rem 1rem;
              border-radius: 12px;
              display: flex;
              align-items: center;
              gap: 10px;
              font-size: 0.85rem;
              font-weight: 600;
              margin-bottom: 1.5rem;
            }

            .form-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 1.25rem;
            }

            .full {
              grid-column: span 2;
            }

            .section-divider {
              font-size: 0.75rem;
              font-weight: 800;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              padding: 1rem 0 0.5rem;
              border-bottom: 1px solid #f1f5f9;
              margin-bottom: 0.5rem;
            }

            .input-group label {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 0.75rem;
              font-weight: 700;
              color: #64748b;
              margin-bottom: 0.5rem;
              text-transform: uppercase;
            }

            .input-group input, .input-group select, .input-group textarea {
              width: 100%;
              padding: 0.75rem 1rem;
              border-radius: 12px;
              border: 1px solid #e2e8f0;
              background: #f8fafc;
              font-size: 0.9rem;
              color: #1e293b;
              font-weight: 500;
              transition: all 0.2s;
            }

            .input-group input:focus, .input-group select:focus, .input-group textarea:focus {
              background: white;
              border-color: #0ea5e9;
              box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1);
              outline: none;
            }

            .modal-footer {
              margin-top: 2rem;
              display: flex;
              justify-content: flex-end;
              gap: 1rem;
            }

            .btn-cancel {
              padding: 0.75rem 1.5rem;
              border-radius: 12px;
              border: 1px solid #e2e8f0;
              background: white;
              color: #64748b;
              font-weight: 700;
              cursor: pointer;
            }

            .btn-save {
              padding: 0.75rem 1.75rem;
              border-radius: 12px;
              border: none;
              background: #0f172a;
              color: white;
              font-weight: 700;
              display: flex;
              align-items: center;
              gap: 10px;
              cursor: pointer;
              transition: all 0.2s;
            }

            .btn-save:hover:not(:disabled) {
              background: #1e293b;
              transform: translateY(-2px);
            }

            .spinner-small {
              width: 20px;
              height: 20px;
              border: 2px solid rgba(255,255,255,0.3);
              border-top-color: white;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
            }

            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ClienteModal;
