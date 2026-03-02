import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Save, CheckCircle2, Briefcase, Users, Phone, Mail, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import { maestroMetasService } from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';

const MaestroMetasModal = ({ isOpen, onClose, onSave, existingMeta = null }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [existingMetas, setExistingMetas] = useState([]);
    const [availableWeeks, setAvailableWeeks] = useState([]);
    const [isDuplicate, setIsDuplicate] = useState(false);
    const [formData, setFormData] = useState({
        nombre_meta: '',
        meta_visitas: 25,
        meta_visitas_asistidas: 5,
        meta_llamadas: 30,
        meta_emails: 100,
        meta_cotizaciones: 10,
        meta_ventas: 0,
        puntos_visita: 10,
        puntos_visita_asistida: 5,
        puntos_llamada: 1,
        puntos_email: 1,
        puntos_cotizacion: 2,
        puntos_venta: 10,
        puntaje_objetivo: 205,
        is_active: 1
    });

    const getMonday = (d) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    };

    const getWeekNumber = (d) => {
        const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
        return weekNo;
    };

    const generateWeekOptions = () => {
        const options = [];
        const today = new Date();
        const currentMonday = getMonday(today);

        for (let i = 0; i < 4; i++) {
            const monday = new Date(currentMonday);
            monday.setDate(currentMonday.getDate() + (i * 7));
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);

            const weekNum = getWeekNumber(monday);
            const dayMo = monday.getDate().toString().padStart(2, '0');
            const monthMo = (monday.getMonth() + 1).toString().padStart(2, '0');
            const daySu = sunday.getDate().toString().padStart(2, '0');
            const monthSu = (sunday.getMonth() + 1).toString().padStart(2, '0');

            const label = `Semana ${weekNum} (${dayMo}/${monthMo} - ${daySu}/${monthSu})`;
            options.push({ value: label, label });
        }
        return options;
    };

    useEffect(() => {
        const fetchMetas = async () => {
            try {
                const metas = await maestroMetasService.getAll();
                setExistingMetas(metas);
            } catch (err) {
                console.error("Error al cargar metas existentes", err);
            }
        };

        const weeks = generateWeekOptions();
        setAvailableWeeks(weeks);

        if (isOpen) {
            fetchMetas();
        }
    }, [isOpen]);

    useEffect(() => {
        if (existingMeta) {
            setFormData({
                ...existingMeta,
                meta_ventas: parseFloat(existingMeta.meta_ventas || 0)
            });
            setIsDuplicate(false);
        } else if (isOpen && availableWeeks.length > 0) {
            const defaultWeek = availableWeeks[0].value;
            setFormData(prev => ({
                ...prev,
                nombre_meta: defaultWeek,
                meta_visitas: 25,
                meta_visitas_asistidas: 5,
                meta_llamadas: 30,
                meta_emails: 100,
                meta_cotizaciones: 10,
                meta_ventas: 0,
                puntos_visita: 10,
                puntos_visita_asistida: 5,
                puntos_llamada: 1,
                puntos_email: 1,
                puntos_cotizacion: 2,
                puntos_venta: 10,
                puntaje_objetivo: 205,
                is_active: 1
            }));

            // Check if default is already taken
            const duplicate = existingMetas.some(m => m.nombre_meta === defaultWeek);
            setIsDuplicate(duplicate);
        }
    }, [existingMeta, isOpen, availableWeeks, existingMetas]);

    useEffect(() => {
        const total = (
            (formData.meta_visitas * formData.puntos_visita) +
            (formData.meta_visitas_asistidas * formData.puntos_visita_asistida) +
            (formData.meta_llamadas * formData.puntos_llamada) +
            (formData.meta_emails * formData.puntos_email) +
            (formData.meta_cotizaciones * formData.puntos_cotizacion) +
            (formData.meta_ventas * formData.puntos_venta)
        );
        setFormData(prev => {
            if (prev.puntaje_objetivo === total) return prev;
            return { ...prev, puntaje_objetivo: Math.round(total) };
        });
    }, [
        formData.meta_visitas, formData.puntos_visita,
        formData.meta_visitas_asistidas, formData.puntos_visita_asistida,
        formData.meta_llamadas, formData.puntos_llamada,
        formData.meta_emails, formData.puntos_email,
        formData.meta_cotizaciones, formData.puntos_cotizacion,
        formData.meta_ventas, formData.puntos_venta
    ]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;

        if (name === 'nombre_meta') {
            const duplicate = existingMetas.some(m => m.nombre_meta === value);
            setIsDuplicate(duplicate);
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (name === 'meta_ventas' ? parseFloat(value) : parseInt(value)) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (existingMeta?.id_maestro) {
                await maestroMetasService.update(existingMeta.id_maestro, formData);
            } else {
                await maestroMetasService.create(formData);
            }
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onSave?.();
                onClose();
            }, 1500);
        } catch (err) {
            setError(err.message || 'Error al guardar las metas');
        } finally {
            setLoading(false);
        }
    };

    const MetaInput = ({ icon: Icon, label, name, value, sublabel }) => (
        <div className="meta-input-card glass-morphism">
            <div className="card-header">
                <div className="icon-wrap">
                    <Icon size={18} />
                </div>
                <div className="label-wrap">
                    <span className="main-label">{label}</span>
                    <span className="sub-label">{sublabel}</span>
                </div>
            </div>
            <div className="input-wrap">
                <input
                    type="number"
                    name={name}
                    value={value}
                    onChange={handleChange}
                    min="0"
                />
                <span className="unit">UNID.</span>
            </div>
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="modal-container glass-morphism"
            >
                <div className="modal-header">
                    <div className="title-group">
                        <div className="title-icon">
                            <Target size={24} />
                        </div>
                        <div className="header-text">
                            <h3>Configurar Metas Globales</h3>
                            <p>Defina los objetivos comerciales para todo el equipo de ventas.</p>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body-scroll">
                        <div className="p-section-title">
                            <span className="badge">Paso 1</span>
                            <h4>Identificación de la Meta</h4>
                        </div>

                        <div className="form-group-full">
                            <label>Semana de Aplicación</label>
                            <div className={`select-wrap ${isDuplicate ? 'warning' : ''}`}>
                                <select
                                    name="nombre_meta"
                                    value={formData.nombre_meta}
                                    onChange={handleChange}
                                    disabled={!!existingMeta}
                                    required
                                >
                                    {availableWeeks.map(w => (
                                        <option key={w.value} value={w.value}>{w.label}</option>
                                    ))}
                                </select>
                            </div>
                            {isDuplicate && (
                                <div className="field-warning">
                                    <AlertCircle size={14} />
                                    <span>Esta semana ya tiene metas registradas.</span>
                                </div>
                            )}
                        </div>

                        <div className="p-section-title">
                            <span className="badge">Paso 2</span>
                            <h4>Objetivos Semanales (Cantidades)</h4>
                        </div>

                        <div className="metas-grid-elite">
                            <MetaInput
                                icon={Briefcase}
                                label="Visitas"
                                name="meta_visitas"
                                value={formData.meta_visitas}
                                sublabel="Visitas presenciales"
                            />
                            <MetaInput
                                icon={Users}
                                label="Asistidas"
                                name="meta_visitas_asistidas"
                                value={formData.meta_visitas_asistidas}
                                sublabel="Soporte técnico / Acompañ."
                            />
                            <MetaInput
                                icon={Phone}
                                label="Llamadas"
                                name="meta_llamadas"
                                value={formData.meta_llamadas}
                                sublabel="Seguimiento llamadas"
                            />
                            <MetaInput
                                icon={Mail}
                                label="Emails"
                                name="meta_emails"
                                value={formData.meta_emails}
                                sublabel="Correos y propuestas"
                            />
                            <MetaInput
                                icon={FileText}
                                label="Cotizaciones"
                                name="meta_cotizaciones"
                                value={formData.meta_cotizaciones}
                                sublabel="Nuevas cotizaciones"
                            />
                            <MetaInput
                                icon={TrendingUp}
                                label="Ventas ($)"
                                name="meta_ventas"
                                value={formData.meta_ventas}
                                sublabel="Monto objetivo (USD)"
                            />
                        </div>

                        <div className="p-section-title">
                            <span className="badge">Paso 3</span>
                            <h4>Puntajes por Actividad (KPI)</h4>
                        </div>
                        <p className="section-desc">Puntos que suma el asesor por cada actividad completada exitosamente.</p>

                        <div className="scores-grid">
                            <div className="score-item">
                                <label>Puntos Visita</label>
                                <input type="number" name="puntos_visita" value={formData.puntos_visita} onChange={handleChange} />
                            </div>
                            <div className="score-item">
                                <label>Puntos Asistida</label>
                                <input type="number" name="puntos_visita_asistida" value={formData.puntos_visita_asistida} onChange={handleChange} />
                            </div>
                            <div className="score-item">
                                <label>Puntos Llamada</label>
                                <input type="number" name="puntos_llamada" value={formData.puntos_llamada} onChange={handleChange} />
                            </div>
                            <div className="score-item">
                                <label>Puntos Email</label>
                                <input type="number" name="puntos_email" value={formData.puntos_email} onChange={handleChange} />
                            </div>
                            <div className="score-item">
                                <label>Puntos Cotiz.</label>
                                <input type="number" name="puntos_cotizacion" value={formData.puntos_cotizacion} onChange={handleChange} />
                            </div>
                            <div className="score-item">
                                <label>Puntos Venta</label>
                                <input type="number" name="puntos_venta" value={formData.puntos_venta} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="objective-total glass-morphism">
                            <div className="info">
                                <strong>Puntaje Objetivo Semanal</strong>
                                <p>Total de puntos requeridos para considerar cumplimiento 100%.</p>
                            </div>
                            <div className="total-display">
                                {formData.puntaje_objetivo}
                            </div>
                        </div>

                        {error && (
                            <div className="error-alert">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
                            Cerrar
                        </button>
                        <button
                            type="submit"
                            className={`btn-save ${success ? 'success' : ''} ${isDuplicate && !existingMeta ? 'btn-disabled' : ''}`}
                            disabled={loading || success || (isDuplicate && !existingMeta)}
                        >
                            {loading ? <LoadingSpinner size="sm" color="white" inline /> : (
                                success ? (
                                    <>
                                        <CheckCircle2 size={18} />
                                        <span>¡Metas Guardadas!</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        <span>Guardar Configuración</span>
                                    </>
                                )
                            )}
                        </button>
                    </div>
                </form>

                <style jsx>{`
                    .modal-overlay {
                        position: fixed; inset: 0; z-index: 5000;
                        background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(8px);
                        display: flex; align-items: center; justify-content: center;
                    }
                    .modal-container {
                        width: 90%; max-width: 850px; background: white; border-radius: 32px;
                        display: flex; flex-direction: column; max-height: 90vh;
                        box-shadow: 0 40px 100px -20px rgba(0,0,0,0.3);
                        border: 1px solid rgba(255,255,255,0.8); overflow: hidden;
                    }
                    .modal-header {
                        padding: 1.5rem 2.5rem; border-bottom: 1px solid #f1f5f9;
                        display: flex; justify-content: space-between; align-items: center;
                    }
                    .title-group { display: flex; gap: 1.25rem; align-items: center; }
                    .title-icon {
                        width: 48px; height: 48px; border-radius: 14px; background: #eff6ff;
                        color: #3b82f6; display: flex; align-items: center; justify-content: center;
                    }
                    .header-text h3 { font-size: 1.25rem; font-weight: 900; color: #1e293b; margin: 0; letter-spacing: -0.02em; }
                    .header-text p { font-size: 0.85rem; color: #64748b; margin: 4px 0 0 0; font-weight: 500; }
                    
                    .close-btn { 
                        width: 40px; height: 40px; border-radius: 12px; border: none;
                        background: #f8fafc; color: #94a3b8; display: flex; align-items: center; justify-content: center;
                        cursor: pointer; transition: all 0.2s;
                    }
                    .close-btn:hover { background: #fee2e2; color: #ef4444; }

                    form {
                        display: flex;
                        flex-direction: column;
                        flex: 1;
                        min-height: 0;
                    }

                    .modal-body-scroll { 
                        padding: 2rem 2.5rem; 
                        overflow-y: auto; 
                        flex: 1;
                        min-height: 0;
                    }
                    
                    .p-section-title { 
                        display: flex; align-items: center; gap: 12px; margin-bottom: 1.5rem; 
                        margin-top: 2rem;
                    }
                    .p-section-title:first-child { margin-top: 0; }
                    .p-section-title .badge {
                        background: #f1f5f9; color: #64748b; font-size: 0.7rem; font-weight: 800;
                        padding: 4px 10px; border-radius: 50px; text-transform: uppercase;
                    }
                    .p-section-title h4 { font-size: 0.95rem; font-weight: 800; color: #1e293b; margin: 0; }
                    .section-desc { font-size: 0.85rem; color: #64748b; margin: -1rem 0 1.5rem 0; font-weight: 500; }

                    .form-group-full label { display: block; font-size: 0.8rem; font-weight: 800; color: #64748b; margin-bottom: 8px; text-transform: uppercase; }
                    
                    .select-wrap { position: relative; }
                    .select-wrap::after {
                        content: ''; position: absolute; right: 1.25rem; top: 50%;
                        width: 8px; height: 8px; border-right: 2px solid #64748b; border-bottom: 2px solid #64748b;
                        transform: translateY(-70%) rotate(45deg); pointer-events: none;
                    }

                    .form-group-full input, .select-wrap select {
                        width: 100%; height: 52px; border-radius: 16px; border: 1.5px solid #e2e8f0;
                        padding: 0 1.25rem; font-size: 0.95rem; font-weight: 700; color: #1e293b;
                        background: #f8fafc; outline: none; transition: all 0.2s;
                        appearance: none;
                    }
                    .form-group-full input:focus, .select-wrap select:focus { border-color: #3b82f6; background: white; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
                    .select-wrap.warning select { border-color: #f59e0b; background: #fffbeb; }

                    .field-warning {
                        display: flex; align-items: center; gap: 6px; margin-top: 8px;
                        color: #f59e0b; font-size: 0.75rem; font-weight: 700;
                    }

                    .btn-save.btn-disabled {
                        background: #cbd5e1 !important;
                        cursor: not-allowed !important;
                        transform: none !important;
                        box-shadow: none !important;
                        opacity: 0.7;
                    }

                    .metas-grid-elite { 
                        display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); 
                        gap: 1.25rem; margin-bottom: 2rem;
                    }
                    .meta-input-card { 
                        padding: 1.25rem; border-radius: 20px; border: 1.5px solid #f1f5f9;
                        transition: all 0.2s;
                    }
                    .meta-input-card:hover { border-color: #3b82f6; transform: translateY(-2px); }
                    .card-header { display: flex; gap: 12px; align-items: center; margin-bottom: 1rem; }
                    .icon-wrap { width: 36px; height: 36px; border-radius: 10px; background: #f8fafc; color: #3b82f6; display: flex; align-items: center; justify-content: center; }
                    .label-wrap { display: flex; flex-direction: column; }
                    .main-label { font-size: 0.85rem; font-weight: 800; color: #1e293b; }
                    .sub-label { font-size: 0.65rem; color: #94a3b8; font-weight: 600; }

                    .input-wrap { display: flex; align-items: center; gap: 8px; background: #f8fafc; border-radius: 12px; padding: 0 12px; border: 1.5px solid #e2e8f0; height: 44px; }
                    .input-wrap input { border: none; background: transparent; width: 100%; font-size: 1.1rem; font-weight: 900; color: #1e293b; outline: none; }
                    .input-wrap .unit { font-size: 0.6rem; font-weight: 800; color: #94a3b8; }

                    .scores-grid { 
                        display: grid; grid-template-columns: repeat(3, 1fr); 
                        gap: 1rem; margin-bottom: 1.5rem;
                    }
                    .score-item { 
                        background: #f8fafc; padding: 12px 16px; border-radius: 14px;
                        display: flex; flex-direction: column; gap: 4px;
                    }
                    .score-item label { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
                    .score-item input { border: none; background: transparent; font-size: 1.1rem; font-weight: 900; color: #3b82f6; outline: none; width: 100%; }

                    .objective-total {
                        background: #1e293b !important; color: white; padding: 1.5rem 2rem; border-radius: 24px;
                        display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;
                    }
                    .objective-total .info strong { display: block; font-size: 1rem; font-weight: 900; letter-spacing: -0.01em; }
                    .objective-total .info p { font-size: 0.8rem; opacity: 0.6; margin: 4px 0 0 0; font-weight: 500; }
                    .total-display {
                        width: 120px; height: 56px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
                        border-radius: 16px; color: #4ade80; font-size: 1.8rem; font-weight: 900; 
                        display: flex; align-items: center; justify-content: center;
                        transition: all 0.2s;
                    }

                    .error-alert {
                        margin-top: 1.5rem; background: #fee2e2; color: #ef4444; padding: 1rem;
                        border-radius: 14px; display: flex; align-items: center; gap: 10px;
                        font-size: 0.85rem; font-weight: 700;
                    }

                    .modal-footer {
                        padding: 1.5rem 2.5rem; border-top: 1px solid #f1f5f9;
                        display: flex; justify-content: flex-end; gap: 1rem;
                    }
                    .btn-cancel { 
                        padding: 0 1.5rem; height: 48px; border-radius: 14px; border: 1.5px solid #e2e8f0;
                        background: white; color: #64748b; font-weight: 800; font-size: 0.85rem; cursor: pointer;
                        transition: all 0.2s;
                    }
                    .btn-cancel:hover { background: #f8fafc; border-color: #cbd5e1; color: #1e293b; }
                    
                    .btn-save {
                        padding: 0 2rem; height: 48px; border-radius: 14px; border: none;
                        background: #1e293b; color: white; font-weight: 800; font-size: 0.85rem;
                        display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.3s;
                    }
                    .btn-save:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(30, 41, 59, 0.3); }
                    .btn-save.success { background: #10b981; }

                    @media (max-width: 768px) {
                        .scores-grid { grid-template-columns: repeat(2, 1fr); }
                        .metas-grid-elite { grid-template-columns: 1fr; }
                    }
                `}</style>
            </motion.div>
        </div>
    );
};

export default MaestroMetasModal;
