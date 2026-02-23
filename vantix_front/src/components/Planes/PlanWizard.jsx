import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ChevronRight,
    ChevronLeft,
    Calendar,
    Target,
    ClipboardList,
    CheckCircle,
    User,
    Plus,
    Trash2,
    Clock,
    Building2,
    Briefcase,
    Phone,
    Search,
    ChevronDown,
    Mail,
    Users
} from 'lucide-react';
import { empleadoService, clienteService, planService } from '../../services/api';

const ClientSearchSelect = ({ clientes, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);

    const selectedClient = clientes.find(c => c.id_cliente === parseInt(value));

    const filtered = clientes.filter(c =>
        c.nombre_cliente.toLowerCase().includes(search.toLowerCase()) ||
        c.ruc_dni?.includes(search)
    ).slice(0, 50);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="client-search-container" ref={dropdownRef}>
            <div className="client-search-trigger" onClick={() => setIsOpen(!isOpen)}>
                <Building2 size={14} />
                <span className={!selectedClient ? 'placeholder' : ''}>
                    {selectedClient ? selectedClient.nombre_cliente : 'Seleccionar Cliente...'}
                </span>
                <ChevronDown size={14} className={`arrow ${isOpen ? 'open' : ''}`} />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="client-search-dropdown"
                    >
                        <div className="search-input-wrapper">
                            <Search size={14} />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Buscar cliente..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                        <div className="results-list">
                            {filtered.map(c => (
                                <div
                                    key={c.id_cliente}
                                    className={`result-item ${parseInt(value) === c.id_cliente ? 'selected' : ''}`}
                                    onClick={() => {
                                        onChange(c.id_cliente);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                >
                                    <span className="name">{c.nombre_cliente}</span>
                                    <span className="ruc">{c.ruc_dni}</span>
                                </div>
                            ))}
                            {filtered.length === 0 && (
                                <div className="no-results">No se encontraron clientes</div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .client-search-container {
                    position: relative;
                    width: 100%;
                }
                .client-search-trigger {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: white;
                    padding: 8px 14px;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    cursor: pointer;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #1e293b;
                    transition: all 0.2s;
                    min-height: 42px;
                }
                .client-search-trigger:hover { border-color: #0ea5e9; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                .client-search-trigger .placeholder { color: #94a3b8; }
                .client-search-trigger .arrow { margin-left: auto; transition: transform 0.2s; color: #94a3b8; }
                .client-search-trigger .arrow.open { transform: rotate(180deg); color: #0ea5e9; }

                .client-search-dropdown {
                    position: absolute;
                    top: calc(100% + 8px);
                    left: 0;
                    right: 0;
                    background: white;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
                    z-index: 1000;
                    padding: 10px;
                }
                .search-input-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: #f8fafc;
                    border-radius: 10px;
                    padding: 0 12px;
                    margin-bottom: 10px;
                    border: 1px solid #f1f5f9;
                }
                .search-input-wrapper input {
                    border: none;
                    background: none;
                    outline: none;
                    padding: 10px 0;
                    width: 100%;
                    font-size: 0.85rem;
                    color: #1e293b;
                    font-weight: 500;
                }
                .results-list { max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
                .results-list::-webkit-scrollbar { width: 4px; }
                .results-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

                .result-item {
                    padding: 10px 12px;
                    border-radius: 10px;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    transition: all 0.2s;
                }
                .result-item:hover { background: #f1f5f9; }
                .result-item.selected { background: #eff6ff; border-left: 4px solid #0ea5e9; }
                .result-item .name { font-size: 0.85rem; font-weight: 700; color: #1e293b; }
                .result-item .ruc { font-size: 0.75rem; color: #64748b; font-weight: 500; }
                .no-results { padding: 30px 20px; text-align: center; color: #94a3b8; font-size: 0.85rem; font-weight: 500; }
            `}</style>
        </div>
    );
};

const PlanWizard = ({ isOpen, onClose, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [empleados, setEmpleados] = useState([]);
    const [clientes, setClientes] = useState([]);

    const [formData, setFormData] = useState({
        id_empleado: '',
        fecha_inicio_semana: '',
        fecha_fin_semana: '',
        meta_visitas: 25,
        meta_visitas_asistidas: 5,
        meta_llamadas: 30,
        meta_emails: 100,
        detalles_agenda: []
    });

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
            // Set default dates (next Monday to Saturday)
            const nextMonday = new Date();
            nextMonday.setDate(nextMonday.getDate() + (1 + 7 - nextMonday.getDay()) % 7);
            const nextSaturday = new Date(nextMonday);
            nextSaturday.setDate(nextSaturday.getDate() + 5);

            setFormData(prev => ({
                ...prev,
                fecha_inicio_semana: nextMonday.toISOString().split('T')[0],
                fecha_fin_semana: nextSaturday.toISOString().split('T')[0]
            }));
        }
    }, [isOpen]);

    const fetchInitialData = async () => {
        try {
            const [empData, cliData] = await Promise.all([
                empleadoService.getAll(),
                clienteService.getAll(0, 500)
            ]);
            setEmpleados(empData);
            setClientes(cliData);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const handleAddActivity = (dia) => {
        const newActivity = {
            dia_semana: dia,
            hora_programada: '09:00',
            tipo_actividad: 'VISITA',
            id_cliente: ''
        };
        setFormData(prev => ({
            ...prev,
            detalles_agenda: [...prev.detalles_agenda, newActivity]
        }));
    };

    const handleRemoveActivity = (index) => {
        setFormData(prev => ({
            ...prev,
            detalles_agenda: prev.detalles_agenda.filter((_, i) => i !== index)
        }));
    };

    const handleUpdateActivity = (index, field, value) => {
        const updatedAgenda = [...formData.detalles_agenda];
        updatedAgenda[index] = { ...updatedAgenda[index], [field]: value };
        setFormData(prev => ({ ...prev, detalles_agenda: updatedAgenda }));
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const payload = {
                fecha_inicio_semana: formData.fecha_inicio_semana,
                fecha_fin_semana: formData.fecha_fin_semana,
                detalles_agenda: formData.detalles_agenda,
                meta_visitas: parseInt(formData.meta_visitas),
                meta_visitas_asistidas: parseInt(formData.meta_visitas_asistidas),
                meta_llamadas: parseInt(formData.meta_llamadas),
                meta_emails: parseInt(formData.meta_emails)
            };
            await planService.create(payload, formData.id_empleado);
            onSuccess();
            onClose();
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="wizard-overlay">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="wizard-modal glass-morphism"
            >
                <div className="wizard-sidebar">
                    <div className="wizard-logo">
                        <div className="logo-icon">V</div>
                        <span>VANTIX <span>Plan</span></span>
                    </div>
                    <div className="steps-indicator">
                        {[
                            { n: 1, label: 'Asignación', icon: <User size={18} /> },
                            { n: 2, label: 'Metas Semanales', icon: <Target size={18} /> },
                            { n: 3, label: 'Planificación', icon: <ClipboardList size={18} /> },
                            { n: 4, label: 'Confirmación', icon: <CheckCircle size={18} /> }
                        ].map((s) => (
                            <div key={s.n} className={`step-item ${step === s.n ? 'active' : ''} ${step > s.n ? 'completed' : ''}`}>
                                <div className="step-icon">{step > s.n ? <CheckCircle size={14} /> : s.icon}</div>
                                <div className="step-text">
                                    <span className="step-number">PASO {s.n}</span>
                                    <span className="step-label">{s.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="wizard-footer-note">
                        <Calendar size={14} />
                        <span>Semana: {formData.fecha_inicio_semana || 'Seleccionar'}</span>
                    </div>
                </div>

                <div className="wizard-content-area">
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>

                    <div className="wizard-main-content">
                        {step === 1 && (
                            <div className="wizard-step">
                                <h3>Asignación de Plan Semanal</h3>
                                <p>Selecciona al asesor y el periodo de trabajo.</p>

                                <div className="form-group">
                                    <label>Asesor Comercial</label>
                                    <div className="input-with-icon">
                                        <User size={18} />
                                        <select
                                            value={formData.id_empleado}
                                            onChange={(e) => setFormData({ ...formData, id_empleado: e.target.value })}
                                        >
                                            <option value="">Seleccionar Asesor...</option>
                                            {empleados.map(e => (
                                                <option key={e.id_empleado} value={e.id_empleado}>
                                                    {e.nombre_completo} - {e.cargo}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="date-range">
                                    <div className="form-group">
                                        <label>Inicio de Semana (Lunes)</label>
                                        <input
                                            type="date"
                                            value={formData.fecha_inicio_semana}
                                            onChange={(e) => setFormData({ ...formData, fecha_inicio_semana: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Fin de Semana (Viernes)</label>
                                        <input
                                            type="date"
                                            value={formData.fecha_fin_semana}
                                            onChange={(e) => setFormData({ ...formData, fecha_fin_semana: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="wizard-step">
                                <h3>Definición de Metas</h3>
                                <p>Establece los objetivos de actividad para esta semana.</p>

                                <div className="metas-dashboard-grid">
                                    <div className="meta-card-premium visit">
                                        <div className="meta-info">
                                            <div className="meta-icon-box"><Briefcase size={22} /></div>
                                            <div className="meta-text">
                                                <span className="meta-title">Visitas Semanales</span>
                                                <span className="meta-desc">Objetivo de clientes a visitar</span>
                                            </div>
                                        </div>
                                        <div className="meta-input-section">
                                            <input
                                                type="number"
                                                value={formData.meta_visitas}
                                                onChange={(e) => setFormData({ ...formData, meta_visitas: e.target.value })}
                                            />
                                            <span className="meta-unit">unid.</span>
                                        </div>
                                    </div>

                                    <div className="meta-card-premium asistida">
                                        <div className="meta-info">
                                            <div className="meta-icon-box"><Users size={22} /></div>
                                            <div className="meta-text">
                                                <span className="meta-title">Visitas Asistidas</span>
                                                <span className="meta-desc">Visitas con acompañamiento</span>
                                            </div>
                                        </div>
                                        <div className="meta-input-section">
                                            <input
                                                type="number"
                                                value={formData.meta_visitas_asistidas}
                                                onChange={(e) => setFormData({ ...formData, meta_visitas_asistidas: e.target.value })}
                                            />
                                            <span className="meta-unit">unid.</span>
                                        </div>
                                    </div>

                                    <div className="meta-card-premium call">
                                        <div className="meta-info">
                                            <div className="meta-icon-box"><Phone size={22} /></div>
                                            <div className="meta-text">
                                                <span className="meta-title">Llamadas Telemarketing</span>
                                                <span className="meta-desc">Prospección y seguimiento</span>
                                            </div>
                                        </div>
                                        <div className="meta-input-section">
                                            <input
                                                type="number"
                                                value={formData.meta_llamadas}
                                                onChange={(e) => setFormData({ ...formData, meta_llamadas: e.target.value })}
                                            />
                                            <span className="meta-unit">unid.</span>
                                        </div>
                                    </div>

                                    <div className="meta-card-premium email">
                                        <div className="meta-info">
                                            <div className="meta-icon-box"><Mail size={22} /></div>
                                            <div className="meta-text">
                                                <span className="meta-title">Correos / Propuestas</span>
                                                <span className="meta-desc">Envío de información formal</span>
                                            </div>
                                        </div>
                                        <div className="meta-input-section">
                                            <input
                                                type="number"
                                                value={formData.meta_emails}
                                                onChange={(e) => setFormData({ ...formData, meta_emails: e.target.value })}
                                            />
                                            <span className="meta-unit">unid.</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="director-note">
                                    <strong>Nota de Dirección:</strong> "Mantener la calidad de las visitas presenciales es prioridad semana 08."
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="wizard-step agenda-step">
                                <h3>Planificación de Agenda</h3>
                                <p>Organiza las actividades diarias con los clientes.</p>

                                <div className="agenda-manager">
                                    <div className="days-nav">
                                        {['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'].map(dia => (
                                            <button
                                                key={dia}
                                                className="day-add-btn"
                                                onClick={() => handleAddActivity(dia)}
                                            >
                                                <Plus size={14} />
                                                <span>{dia}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="activities-list">
                                        {formData.detalles_agenda.map((act, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="activity-row"
                                            >
                                                <div className="act-dia">{act.dia_semana.slice(0, 3)}</div>
                                                <div className="act-hora">
                                                    <Clock size={14} />
                                                    <input
                                                        type="time"
                                                        value={act.hora_programada}
                                                        onChange={(e) => handleUpdateActivity(index, 'hora_programada', e.target.value)}
                                                    />
                                                </div>
                                                <div className="act-type">
                                                    <select
                                                        value={act.tipo_actividad}
                                                        onChange={(e) => handleUpdateActivity(index, 'tipo_actividad', e.target.value)}
                                                    >
                                                        <option value="VISITA">Visita</option>
                                                        <option value="VISITA_ASISTIDA">Visita Asistida</option>
                                                        <option value="LLAMADA">Llamada</option>
                                                        <option value="EMAIL">Email</option>
                                                    </select>
                                                </div>
                                                <div className="act-client-wrapper">
                                                    <ClientSearchSelect
                                                        clientes={clientes}
                                                        value={act.id_cliente}
                                                        onChange={(val) => handleUpdateActivity(index, 'id_cliente', val)}
                                                    />
                                                </div>
                                                <button
                                                    className="remove-act"
                                                    onClick={() => handleRemoveActivity(index)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </motion.div>
                                        ))}
                                        {formData.detalles_agenda.length === 0 && (
                                            <div className="empty-agenda">
                                                <Clock size={32} />
                                                <p>Haz clic en los botones superiores para agregar actividades por día.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="wizard-step summary-step-revamp">
                                <h3>Resumen del Plan de Trabajo</h3>
                                <p>Revisa la agenda detallada que has estipulado para esta semana.</p>

                                <div className="summary-compact-header header-premium-glass">
                                    <div className="header-info-main">
                                        <div className="profile-section">
                                            <div className="avatar-gradient">
                                                {(empleados.find(e => e.id_empleado === parseInt(formData.id_empleado))?.nombre_completo || 'A').charAt(0)}
                                            </div>
                                            <div className="user-meta">
                                                <h4 className="user-name">{empleados.find(e => e.id_empleado === parseInt(formData.id_empleado))?.nombre_completo}</h4>
                                                <div className="date-range-badge">
                                                    <Calendar size={12} />
                                                    <span>{formData.fecha_inicio_semana} — {formData.fecha_fin_semana}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="stats-dashboard-mini">
                                            <div className="stat-card-mini visit">
                                                <div className="stat-icon"><Briefcase size={14} /></div>
                                                <div className="stat-details">
                                                    <span className="stat-label">Visitas</span>
                                                    <div className="stat-value">
                                                        <span className="current">{formData.detalles_agenda.filter(a => a.tipo_actividad === 'VISITA').length}</span>
                                                        <span className="total">/{formData.meta_visitas}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="stat-card-mini asistida">
                                                <div className="stat-icon"><Users size={14} /></div>
                                                <div className="stat-details">
                                                    <span className="stat-label">Asistidas</span>
                                                    <div className="stat-value">
                                                        <span className="current">{formData.detalles_agenda.filter(a => a.tipo_actividad === 'VISITA_ASISTIDA').length}</span>
                                                        <span className="total">/{formData.meta_visitas_asistidas}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="stat-card-mini call">
                                                <div className="stat-icon"><Phone size={14} /></div>
                                                <div className="stat-details">
                                                    <span className="stat-label">Llamadas</span>
                                                    <div className="stat-value">
                                                        <span className="current">{formData.detalles_agenda.filter(a => a.tipo_actividad === 'LLAMADA').length}</span>
                                                        <span className="total">/{formData.meta_llamadas}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="stat-card-mini email">
                                                <div className="stat-icon"><Mail size={14} /></div>
                                                <div className="stat-details">
                                                    <span className="stat-label">Emails</span>
                                                    <div className="stat-value">
                                                        <span className="current">{formData.detalles_agenda.filter(a => a.tipo_actividad === 'EMAIL').length}</span>
                                                        <span className="total">/{formData.meta_emails}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="agenda-review-list shadow-hover">
                                    <table className="summary-table">
                                        <thead>
                                            <tr>
                                                <th>Día</th>
                                                <th>Hora</th>
                                                <th>Actividad</th>
                                                <th>Cliente</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.detalles_agenda.sort((a, b) => {
                                                const days = { 'LUNES': 1, 'MARTES': 2, 'MIERCOLES': 3, 'JUEVES': 4, 'VIERNES': 5, 'SÁBADO': 6 };
                                                if (days[a.dia_semana] !== days[b.dia_semana]) return days[a.dia_semana] - days[b.dia_semana];
                                                return a.hora_programada.localeCompare(b.hora_programada);
                                            }).map((act, i) => (
                                                <tr key={i}>
                                                    <td className="day-cell">{act.dia_semana}</td>
                                                    <td className="time-cell">{act.hora_programada}</td>
                                                    <td className="type-cell">
                                                        <span className={`badge-type ${act.tipo_actividad.toLowerCase()}`}>
                                                            {act.tipo_actividad}
                                                        </span>
                                                    </td>
                                                    <td className="client-cell">
                                                        {clientes.find(c => c.id_cliente === parseInt(act.id_cliente))?.nombre_cliente || 'N/A'}
                                                    </td>
                                                </tr>
                                            ))}
                                            {formData.detalles_agenda.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="empty-row">No hay actividades programadas</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="final-disclaimer gold-bg">
                                    <CheckCircle size={16} />
                                    <span>Al confirmar, el plan se registrará como <strong>Borrador</strong>. Puedes editarlo después.</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="wizard-actions">
                        {step > 1 && (
                            <button className="btn-wizard-secondary" onClick={prevStep}>
                                <ChevronLeft size={20} />
                                Atrás
                            </button>
                        )}
                        <div className="spacer"></div>
                        {step < 4 ? (
                            <button
                                className="btn-wizard-primary"
                                onClick={nextStep}
                                disabled={step === 1 && !formData.id_empleado}
                            >
                                Siguiente
                                <ChevronRight size={20} />
                            </button>
                        ) : (
                            <button className="btn-wizard-success" onClick={handleSubmit} disabled={loading}>
                                {loading ? 'Registrando...' : 'Finalizar y Crear Plan'}
                                <CheckCircle size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>

            <style jsx>{`
                .wizard-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(15, 23, 42, 0.8);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 2rem;
                }

                .wizard-modal {
                    width: 100%;
                    max-width: 1100px;
                    height: 650px;
                    background: white;
                    border-radius: 30px;
                    display: flex;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }

                .wizard-sidebar {
                    width: 300px;
                    background: #1e293b;
                    padding: 2.5rem;
                    display: flex;
                    flex-direction: column;
                    color: white;
                }

                .wizard-logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 1.5rem;
                    font-weight: 800;
                    margin-bottom: 3.5rem;
                }

                .logo-icon {
                    width: 40px;
                    height: 40px;
                    background: #0ea5e9;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .wizard-logo span span { color: #0ea5e9; }

                .steps-indicator {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }

                .step-item {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    opacity: 0.4;
                    transition: all 0.3s;
                }

                .step-item.active { opacity: 1; transform: translateX(5px); }
                .step-item.completed { opacity: 0.8; }

                .step-icon {
                    width: 36px;
                    height: 36px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s;
                }

                .step-item.active .step-icon { background: #0ea5e9; box-shadow: 0 0 20px rgba(14, 165, 233, 0.4); }
                .step-item.completed .step-icon { background: #10b981; }

                .step-text { display: flex; flex-direction: column; }
                .step-number { font-size: 0.7rem; font-weight: 800; color: #94a3b8; }
                .step-label { font-size: 0.95rem; font-weight: 700; }

                .wizard-footer-note {
                    margin-top: auto;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.8rem;
                    color: #94a3b8;
                    background: rgba(255,255,255,0.05);
                    padding: 10px;
                    border-radius: 10px;
                }

                .wizard-content-area {
                    flex: 1;
                    padding: 3rem;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    background: #f8fafc;
                }

                .close-btn {
                    position: absolute;
                    top: 2rem;
                    right: 2rem;
                    background: none;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    transition: color 0.2s;
                }

                .close-btn:hover { color: #ef4444; }

                .wizard-main-content { 
                    flex: 1; 
                    overflow-y: auto; 
                    padding-right: 1.5rem;
                    margin-bottom: 2rem;
                }

                .wizard-main-content::-webkit-scrollbar { width: 6px; }
                .wizard-main-content::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

                .wizard-step h3 {
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: #1e293b;
                    margin-bottom: 0.5rem;
                    letter-spacing: -0.02em;
                }

                .wizard-step p { color: #64748b; margin-bottom: 2.5rem; font-size: 1rem; }

                .form-group { margin-bottom: 1.50rem; }
                .form-group label { display: block; font-weight: 700; color: #475569; font-size: 0.9rem; margin-bottom: 0.5rem; }

                .input-with-icon {
                    display: flex;
                    align-items: center;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    padding: 0 1rem;
                    height: 54px;
                }

                .input-with-icon select {
                    border: none;
                    background: none;
                    outline: none;
                    width: 100%;
                    font-size: 1rem;
                    margin-left: 10px;
                    font-weight: 600;
                    color: #1e293b;
                }

                .date-range { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1rem; }
                .date-range input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border-radius: 14px;
                    border: 1px solid #e2e8f0;
                    font-weight: 600;
                    color: #1e293b;
                }

                .metas-dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
                .meta-card-premium {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 20px;
                    border: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .meta-card-premium:hover {
                    box-shadow: 0 10px 25px -4px rgba(0,0,0,0.05);
                    transform: translateY(-2px);
                    border-color: #cbd5e1;
                }

                .meta-info { display: flex; align-items: center; gap: 1rem; }
                .meta-icon-box {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f8fafc;
                }

                .meta-card-premium.visit .meta-icon-box { background: #e0f2fe; color: #0ea5e9; }
                .meta-card-premium.asistida .meta-icon-box { background: #f3e8ff; color: #a855f7; }
                .meta-card-premium.call .meta-icon-box { background: #dcfce7; color: #10b981; }
                .meta-card-premium.email .meta-icon-box { background: #fffbeb; color: #f59e0b; }

                .meta-text { display: flex; flex-direction: column; }
                .meta-title { font-size: 0.95rem; font-weight: 800; color: #1e293b; letter-spacing: -0.01em; }
                .meta-desc { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }

                .meta-input-section { display: flex; align-items: baseline; gap: 6px; }
                .meta-input-section input {
                    width: 70px;
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #1e293b;
                    border: none;
                    background: #f1f5f9;
                    border-radius: 10px;
                    padding: 4px 8px;
                    text-align: center;
                    outline: none;
                }

                .meta-unit { font-size: 0.75rem; font-weight: 800; color: #cbd5e1; text-transform: uppercase; }

                .agenda-manager { background: white; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden; height: 420px; display: flex; flex-direction: column; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
                .days-nav { display: flex; gap: 10px; padding: 1.25rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
                .day-add-btn {
                    padding: 8px 16px;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: #475569;
                }
                .day-add-btn i { color: #0ea5e9; }
                .day-add-btn:hover { background: #1e293b; color: white; border-color: #1e293b; transform: translateY(-1px); }

                .activities-list { flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 10px; }
                .activity-row {
                    display: grid;
                    grid-template-columns: 60px 100px 120px 300px 40px;
                    align-items: center;
                    gap: 15px;
                    padding: 8px 12px;
                    background: #f1f5f9;
                    border-radius: 14px;
                    transition: all 0.2s;
                }

                .activity-row:hover { background: #e2e8f0; }

                .act-dia { font-weight: 800; color: #1e293b; font-size: 0.8rem; text-align: center; }
                .act-hora, .act-type { display: flex; align-items: center; gap: 8px; background: white; padding: 6px 12px; border-radius: 10px; border: 1px solid #e2e8f0; }
                .act-hora input, .act-type select { border: none; outline: none; background: none; font-size: 0.85rem; font-weight: 700; width: 100%; color: #1e293b; }
                .act-client-wrapper { width: 100%; position: relative; }

                .remove-act { border: none; background: none; color: #94a3b8; cursor: pointer; }
                .remove-act:hover { color: #ef4444; }

                .empty-agenda { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #94a3b8; text-align: center; padding: 2rem; }

                .summary-card { background: white; padding: 2rem; border-radius: 20px; border: 2px solid #e2e8f0; display: flex; flex-direction: column; gap: 1rem; }
                .summary-row { display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.75rem; }
                .summary-row span { color: #64748b; font-weight: 600; }
                .summary-row strong { color: #1e293b; }

                .badge-summary { background: #0ea5e9; color: white; padding: 2px 10px; border-radius: 10px; font-weight: 800; }

                .summary-metas { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
                .meta-sum-item { background: #f8fafc; padding: 1rem; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; }

                .confirmation-disclaimer { display: flex; align-items: center; gap: 10px; margin-top: 2rem; color: #64748b; font-size: 0.9rem; }

                .wizard-actions { display: flex; margin-top: auto; padding-top: 2rem; }
                .spacer { flex: 1; }

                .btn-wizard-primary, .btn-wizard-secondary, .btn-wizard-success {
                    padding: 0.8rem 1.8rem;
                    border-radius: 14px;
                    border: none;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .btn-wizard-primary { background: #1e293b; color: white; }
                .btn-wizard-primary:hover { transform: translateX(5px); background: #334155; }
                .btn-wizard-primary:disabled { opacity: 0.5; cursor: not-allowed; }

                .btn-wizard-secondary { background: #f1f5f9; color: #475569; }
                .btn-wizard-secondary:hover { background: #e2e8f0; }

                .btn-wizard-success { background: #10b981; color: white; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3); }
                .btn-wizard-success:hover { transform: scale(1.02); box-shadow: 0 20px 25px -5px rgba(16, 185, 129, 0.4); }

                /* Summary Revamp Styles - Obsidian Premium */
                .summary-step-revamp { padding: 0.5rem; }
                
                .header-premium-glass {
                    background: linear-gradient(135deg, #ffffff, #f8fafc);
                    border: 1px solid #e2e8f0;
                    border-radius: 24px;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                    box-shadow: 0 4px 20px -5px rgba(0,0,0,0.05);
                }

                .header-info-main {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 2rem;
                    flex-wrap: wrap;
                }

                .profile-section {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .avatar-gradient {
                    width: 56px;
                    height: 56px;
                    background: linear-gradient(135deg, #0ea5e9, #2563eb);
                    color: white;
                    border-radius: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    font-size: 1.5rem;
                    box-shadow: 0 8px 16px -4px rgba(14, 165, 233, 0.4);
                }

                .user-meta .user-name {
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: #1e293b;
                    margin: 0 0 4px 0;
                    letter-spacing: -0.02em;
                }

                .date-range-badge {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: #f1f5f9;
                    padding: 4px 12px;
                    border-radius: 30px;
                    font-size: 0.8rem;
                    color: #64748b;
                    font-weight: 700;
                    border: 1px solid #e2e8f0;
                }

                .stats-dashboard-mini {
                    display: flex;
                    gap: 12px;
                }

                .stat-card-mini {
                    background: white;
                    border: 1px solid #f1f5f9;
                    padding: 10px 16px;
                    border-radius: 18px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    min-width: 130px;
                    transition: all 0.2s ease;
                }

                .stat-card-mini:hover {
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
                    transform: translateY(-2px);
                }

                .stat-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .stat-card-mini.visit .stat-icon { background: #e0f2fe; color: #0ea5e9; }
                .stat-card-mini.call .stat-icon { background: #dcfce7; color: #10b981; }
                .stat-card-mini.email .stat-icon { background: #fffbeb; color: #f59e0b; }

                .stat-details { display: flex; flex-direction: column; }
                .stat-label { font-size: 0.7rem; color: #94a3b8; font-weight: 800; text-transform: uppercase; }
                
                .stat-value { display: flex; align-items: baseline; gap: 2px; }
                .stat-value .current { font-size: 1.1rem; font-weight: 800; color: #1e293b; }
                .stat-value .total { font-size: 0.8rem; color: #cbd5e1; font-weight: 600; }

                .agenda-review-list {
                    background: white;
                    border-radius: 20px;
                    border: 1px solid #f1f5f9;
                    max-height: 400px;
                    overflow-y: auto;
                    margin-bottom: 2rem;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
                }

                .summary-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.9rem;
                }

                .summary-table th {
                    text-align: left;
                    padding: 1.1rem;
                    background: #f8fafc;
                    color: #64748b;
                    font-weight: 800;
                    text-transform: uppercase;
                    font-size: 0.7rem;
                    letter-spacing: 0.05em;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    border-bottom: 1px solid #e2e8f0;
                }

                .summary-table td {
                    padding: 1.1rem;
                    border-bottom: 1px solid #f8fafc;
                    color: #334155;
                }

                .day-cell { font-weight: 800; color: #0ea5e9; font-size: 0.75rem; }
                .time-cell { font-family: 'Inter', sans-serif; font-weight: 700; color: #64748b; }
                .client-cell { font-weight: 600; color: #1e293b; }

                .badge-type {
                    padding: 5px 12px;
                    border-radius: 10px;
                    font-size: 0.7rem;
                    font-weight: 800;
                    text-transform: uppercase;
                }

                .badge-type.visita { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
                .badge-type.visita_asistida { background: #f3e8ff; color: #7e22ce; border: 1px solid #e9d5ff; }
                .badge-type.llamada { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
                .badge-type.email { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }

                .stat-card-mini.asistida .stat-icon { background: #f3e8ff; color: #a855f7; }

                .empty-row { text-align: center; color: #94a3b8; padding: 3rem !important; font-style: italic; }

                .final-disclaimer {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 1rem 1.5rem;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    color: #92400e;
                }

                @media (max-height: 700px) {
                    .wizard-modal { height: 95vh; }
                    @keyframes spin { to { transform: rotate(360deg); } }
                }
            `}</style>
        </div>
    );
};

export default PlanWizard;
