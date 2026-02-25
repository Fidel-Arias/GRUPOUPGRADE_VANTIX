import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, CreditCard, Briefcase, Mail, Shield, Save, AlertCircle, Lock, ShieldAlert } from 'lucide-react';

const EmpleadoModal = ({ isOpen, onClose, onSave, empleado = null }) => {
  const [formData, setFormData] = useState({
    nombre_completo: '',
    dni: '',
    cargo: 'Asesor de Ventas',
    email_corporativo: '',
    password: '',
    is_admin: false,
    activo: true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (empleado) {
      setFormData({
        nombre_completo: empleado.nombre_completo || '',
        dni: empleado.dni || '',
        cargo: empleado.cargo || 'Asesor de Ventas',
        email_corporativo: empleado.email_corporativo || '',
        password: '', // No mostramos el password actual
        is_admin: empleado.is_admin ?? false,
        activo: empleado.activo ?? true
      });
    } else {
      setFormData({
        nombre_completo: '',
        dni: '',
        cargo: 'Asesor de Ventas',
        email_corporativo: '',
        password: '',
        is_admin: false,
        activo: true
      });
    }
    setError(null);
  }, [empleado, isOpen]);

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

    // Si es edición y el password está vacío, lo eliminamos para no sobreescribirlo
    const dataToSend = { ...formData };
    if (empleado && !dataToSend.password) {
      delete dataToSend.password;
    }

    try {
      await onSave(dataToSend);
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
                    <User size={20} />
                  </div>
                  <h3>{empleado ? 'Editar Empleado' : 'Nuevo Empleado'}</h3>
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
                    <label><User size={14} /> Nombre Completo</label>
                    <input
                      type="text"
                      name="nombre_completo"
                      value={formData.nombre_completo}
                      onChange={handleChange}
                      placeholder="Ej: Juan Pérez Morales"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label><CreditCard size={14} /> DNI / Identificación</label>
                    <input
                      type="text"
                      name="dni"
                      value={formData.dni}
                      onChange={handleChange}
                      placeholder="8 dígitos"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label><Briefcase size={14} /> Cargo / Área</label>
                    <select
                      name="cargo"
                      value={formData.cargo}
                      onChange={handleChange}
                    >
                      <option value="Asesor de Ventas">Asesor de Ventas</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Gerente Comercial">Gerente Comercial</option>
                      <option value="Administrador">Administrador</option>
                      <option value="Soporte">Soporte</option>
                    </select>
                  </div>

                  <div className="input-group full">
                    <label><Mail size={14} /> Correo Corporativo</label>
                    <input
                      type="email"
                      name="email_corporativo"
                      value={formData.email_corporativo}
                      onChange={handleChange}
                      placeholder="ejemplo@vantix.com"
                      required
                    />
                  </div>

                  <div className="input-group full">
                    <label><Lock size={14} /> Contraseña {empleado && "(dejar en blanco para no cambiar)"}</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required={!empleado}
                    />
                  </div>

                  <div className="input-group">
                    <label className="toggle-label mini">
                      <input
                        type="checkbox"
                        name="is_admin"
                        checked={formData.is_admin}
                        onChange={handleChange}
                      />
                      <span className="toggle-slider"></span>
                      <span className="label-text">
                        <ShieldAlert size={14} />
                        Administrador
                      </span>
                    </label>
                  </div>

                  <div className="input-group">
                    <label className="toggle-label mini">
                      <input
                        type="checkbox"
                        name="activo"
                        checked={formData.activo}
                        onChange={handleChange}
                      />
                      <span className="toggle-slider"></span>
                      <span className="label-text">
                        <Shield size={14} />
                        Usuario Activo
                      </span>
                    </label>
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
                        <span>{empleado ? 'Guardar Cambios' : 'Registrar Empleado'}</span>
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
              max-width: 550px;
              background: var(--bg-panel);
              border-radius: 24px;
              box-shadow: var(--shadow-premium);
              overflow: hidden;
              border: 1px solid var(--border-subtle);
            }

            .modal-header {
              padding: 1.5rem 2rem;
              display: flex;
              justify-content: space-between;
              align-items: center;
              background: var(--bg-app);
              border-bottom: 1px solid var(--border-subtle);
            }

            .title-wrap {
              display: flex;
              align-items: center;
              gap: 12px;
            }

            .icon-badge {
              width: 36px;
              height: 36px;
              background: var(--primary-soft);
              color: var(--primary);
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .modal-header h3 {
              font-size: 1.25rem;
              font-weight: 800;
              color: var(--text-heading);
              letter-spacing: -0.01em;
            }

            .close-btn {
              background: none;
              border: none;
              color: var(--text-muted);
              cursor: pointer;
              padding: 8px;
              border-radius: 50%;
              transition: all 0.2s;
            }

            .close-btn:hover {
              background: var(--bg-app);
              color: #ef4444;
            }

            .modal-form {
              padding: 2rem;
            }

            .error-banner {
              background: rgba(239, 68, 68, 0.1);
              color: #dc2626;
              padding: 0.75rem 1rem;
              border-radius: 12px;
              display: flex;
              align-items: center;
              gap: 10px;
              font-size: 0.85rem;
              font-weight: 600;
              margin-bottom: 1.5rem;
              border: 1px solid rgba(239, 68, 68, 0.2);
            }

            .form-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 1.5rem;
            }

            .full {
              grid-column: span 2;
            }

            .input-group label {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 0.8rem;
              font-weight: 700;
              color: var(--text-muted);
              margin-bottom: 0.5rem;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }

            .input-group input, .input-group select {
              width: 100%;
              height: 46px;
              padding: 0 1rem;
              border-radius: 12px;
              border: 1px solid var(--border-subtle);
              background: var(--bg-app);
              font-size: 0.95rem;
              color: var(--text-heading);
              font-weight: 500;
              transition: all 0.2s;
            }

            .input-group input:focus, .input-group select:focus {
              background: var(--bg-panel);
              border-color: var(--primary);
              box-shadow: 0 0 0 4px var(--primary-glow);
              outline: none;
            }

            .checkbox-group {
              grid-column: span 2;
              padding-top: 0.5rem;
            }

            .toggle-label {
              display: flex;
              align-items: center;
              gap: 12px;
              cursor: pointer;
              user-select: none;
              padding: 0.5rem 0;
            }

            .toggle-label.mini {
              gap: 8px;
            }

            .toggle-label.mini .label-text {
              font-size: 0.8rem;
            }

            .toggle-label.mini .toggle-slider {
              width: 36px;
              height: 18px;
            }

            .toggle-label.mini .toggle-slider::before {
              width: 12px;
              height: 12px;
              top: 3px;
              left: 3px;
            }

            .toggle-label.mini input:checked + .toggle-slider::before {
              left: calc(100% - 15px);
            }

            .toggle-label input {
              display: none;
            }

            .toggle-slider {
              width: 44px;
              height: 22px;
              background: var(--border-subtle);
              border-radius: 20px;
              position: relative;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .toggle-slider::before {
              content: '';
              position: absolute;
              width: 16px;
              height: 16px;
              background: white;
              border-radius: 50%;
              top: 3px;
              left: 3px;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            .toggle-label input:checked + .toggle-slider {
              background: #22c55e;
            }

            .toggle-label input:checked + .toggle-slider::before {
              left: calc(100% - 19px);
            }

            .label-text {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 0.9rem;
              font-weight: 600;
              color: var(--text-heading);
            }

            .modal-footer {
              margin-top: 2.5rem;
              display: flex;
              justify-content: flex-end;
              gap: 1rem;
            }

            .btn-cancel {
              padding: 0.75rem 1.5rem;
              border-radius: 12px;
              border: 1px solid var(--border-subtle);
              background: var(--bg-app);
              color: var(--text-muted);
              font-weight: 700;
              font-size: 0.9rem;
              cursor: pointer;
              transition: all 0.2s;
            }

            .btn-cancel:hover {
              background: var(--bg-panel);
              color: var(--text-heading);
            }

            .btn-save {
              padding: 0.75rem 1.75rem;
              border-radius: 12px;
              border: none;
              background: var(--bg-sidebar);
              color: white;
              font-weight: 700;
              font-size: 0.9rem;
              display: flex;
              align-items: center;
              gap: 10px;
              cursor: pointer;
              transition: all 0.2s;
              box-shadow: var(--shadow-md);
            }

            .btn-save:hover:not(:disabled) {
              background: #1e293b;
              transform: translateY(-2px);
              box-shadow: var(--shadow-lg);
            }

            .btn-save:disabled {
              opacity: 0.7;
              cursor: not-allowed;
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

export default EmpleadoModal;
