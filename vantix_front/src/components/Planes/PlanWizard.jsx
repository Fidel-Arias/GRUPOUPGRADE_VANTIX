import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, ChevronRight, ChevronLeft, Calendar, Target, ClipboardList, CheckCircle,
    User, Plus, Trash2, Clock, Building2, Briefcase, Phone, Search,
    ChevronDown, Mail, Users, Activity, AlertTriangle, Save, AlertCircle
} from 'lucide-react';
import { empleadoService, clienteService, planService, authService, BASE_URL } from '../../services/api';
import PageHeader from '../Common/PageHeader';
import NuevoClienteModal from '../Cartera/NuevoClienteModal';
import PremiumCard from '../Common/PremiumCard';
import Badge from '../Common/Badge';
import LoadingSpinner from '../Common/LoadingSpinner';
import EmptyState from '../Common/EmptyState';
import WeekPicker from '../Common/WeekPicker';

const ClientSearchSelect = ({ clientes, value, onChange, onOpenNuevo }) => {
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
                            <button
                                className="add-new-client-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenNuevo();
                                }}
                            >
                                <Plus size={14} />
                                <span>No está en la lista: Registrar Nuevo</span>
                            </button>
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
                .add-new-client-btn {
                    display: flex; align-items: center; gap: 8px; width: 100%;
                    padding: 8px 10px; border: 1.5px dashed #e2e8f0; border-radius: 10px;
                    background: #f8fafc; color: #0ea5e9; font-weight: 700; font-size: 0.75rem;
                    cursor: pointer; transition: all 0.2s; margin-bottom: 8px;
                }
                .add-new-client-btn:hover { background: #f0f9ff; border-color: #0ea5e9; }
            `}</style>
        </div>
    );
};

const PlanWizard = ({ isOpen = false, onClose = () => { }, onSuccess = () => { }, isPage = false }) => {
    const [user, setUser] = useState(null);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [empleados, setEmpleados] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [isNuevoClienteOpen, setIsNuevoClienteOpen] = useState(false);
    const [availableWeeks, setAvailableWeeks] = useState([]);
    const [existingPlanes, setExistingPlanes] = useState([]);

    const getISOWeek = (date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    };

    const generateWeekOptions = () => {
        const weeks = [];
        const today = new Date();
        const currentDay = today.getDay(); // 0: Sunday, 1: Monday, ..., 6: Saturday
        const currentUser = authService.getUser();
        const isAdmin = currentUser?.is_admin;

        // Determinar el lunes de la semana actual
        const diffToMonday = (currentDay === 0 ? -6 : 1) - currentDay;
        const currentMonday = new Date(today);
        currentMonday.setDate(today.getDate() + diffToMonday);
        currentMonday.setHours(0, 0, 0, 0);

        if (isAdmin) {
            // Administradores: Vista amplia (actual + 5 futuras)
            let baseMonday = new Date(currentMonday);
            for (let i = 0; i < 6; i++) {
                const m = new Date(baseMonday);
                m.setDate(baseMonday.getDate() + (i * 7));
                const s = new Date(m);
                s.setDate(m.getDate() + 5);

                weeks.push({
                    weekNum: getISOWeek(m),
                    monday: m.toISOString().split('T')[0],
                    saturday: s.toISOString().split('T')[0],
                    label: `Semana ${getISOWeek(m)} (${m.getDate()}/${m.getMonth() + 1} al ${s.getDate()}/${s.getMonth() + 1})`
                });
            }
        } else {
            // Asesores: Reglas de negocio restrictivas
            // 1. Semanas pasadas (3 anteriores)
            for (let i = -3; i < 0; i++) {
                const m = new Date(currentMonday);
                m.setDate(currentMonday.getDate() + (i * 7));
                const s = new Date(m);
                s.setDate(m.getDate() + 5);
                weeks.push({
                    weekNum: getISOWeek(m),
                    monday: m.toISOString().split('T')[0],
                    saturday: s.toISOString().split('T')[0],
                    label: `Semana ${getISOWeek(m)} (${m.getDate()}/${m.getMonth() + 1} al ${s.getDate()}/${s.getMonth() + 1})`
                });
            }

            // 2. Semana Actual
            const mNow = new Date(currentMonday);
            const sNow = new Date(mNow);
            sNow.setDate(mNow.getDate() + 5);
            weeks.push({
                weekNum: getISOWeek(mNow),
                monday: mNow.toISOString().split('T')[0],
                saturday: sNow.toISOString().split('T')[0],
                label: `Semana ${getISOWeek(mNow)} (${mNow.getDate()}/${mNow.getMonth() + 1} al ${sNow.getDate()}/${sNow.getMonth() + 1})`
            });

            // 3. Siguiente Semana (SOLO si es Sábado o Domingo)
            if (currentDay === 6 || currentDay === 0) {
                const mNext = new Date(currentMonday);
                mNext.setDate(currentMonday.getDate() + 7);
                const sNext = new Date(mNext);
                sNext.setDate(mNext.getDate() + 5);
                weeks.push({
                    weekNum: getISOWeek(mNext),
                    monday: mNext.toISOString().split('T')[0],
                    saturday: sNext.toISOString().split('T')[0],
                    label: `Semana ${getISOWeek(mNext)} (${mNext.getDate()}/${mNext.getMonth() + 1} al ${sNext.getDate()}/${sNext.getMonth() + 1})`
                });
            }
            
            // Mostrar los más recientes primero para comodidad del usuario
            weeks.reverse();
        }
        return weeks;
    };

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
        if (isOpen || isPage) {
            const currentUser = authService.getUser();
            setUser(currentUser);

            const initializeWizard = async () => {
                let existing = [];
                if (currentUser?.id_empleado) {
                    try {
                        existing = await planService.getAll(0, 100, currentUser.id_empleado);
                        setExistingPlanes(existing);
                    } catch (e) {
                        console.error("Error fetching existing plans:", e);
                    }
                }

                const weeks = generateWeekOptions();
                
                // Filter weeks if advisor (admins can still see all to override or manage)
                let filteredWeeks = weeks;
                if (currentUser && !currentUser.is_admin) {
                    filteredWeeks = weeks.filter(w => 
                        !existing.some(p => p.fecha_inicio_semana.split('T')[0] === w.monday)
                    );
                }
                
                setAvailableWeeks(filteredWeeks);

                if (filteredWeeks.length > 0) {
                    // Intelligent date suggestion logic
                    const today = new Date();
                    const currentDay = today.getDay();
                    const isAdvisor = currentUser && !currentUser.is_admin;

                    let defaultMonday;
                    if (isAdvisor) {
                        defaultMonday = filteredWeeks[0]?.monday;
                    } else {
                        if (currentDay === 0 || currentDay >= 4) {
                            defaultMonday = filteredWeeks[1]?.monday || filteredWeeks[0]?.monday;
                        } else {
                            defaultMonday = filteredWeeks[0]?.monday;
                        }
                    }

                    const selectedW = filteredWeeks.find(w => w.monday === defaultMonday) || filteredWeeks[0];

                    setFormData(prev => ({
                        ...prev,
                        id_empleado: currentUser?.id_empleado || '',
                        fecha_inicio_semana: selectedW.monday,
                        fecha_fin_semana: selectedW.saturday
                    }));
                }
            };

            initializeWizard();
        }
    }, [isOpen, isPage]);

    useEffect(() => {
        if (formData.id_empleado) {
            fetchClientes(formData.id_empleado);
        } else {
            setClientes([]); // Opcional: limpiar si no hay empleado
        }
    }, [formData.id_empleado]);

    const fetchClientes = async (idEmpleado) => {
        try {
            const cliData = await clienteService.getAll(0, 500, idEmpleado);
            setClientes(cliData);
        } catch (error) {
            console.error('Error fetching clients for employee:', error);
        }
    };

    const fetchInitialData = async (currentUser) => {
        // No longer fetching all employees as everyone creates their own plan
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const handleAddActivity = (dia) => {
        const newActivity = {
            dia_semana: dia,
            hora_programada: '09:00',
            tipo_actividad: 'Visita',
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

    const [activeActivity, setActiveActivity] = useState(null);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

    const handleOpenActivityModal = (dia, index = -1) => {
        if (index === -1) {
            setActiveActivity({
                dia_semana: dia,
                hora_programada: '08:00',
                tipo_actividad: 'Visita',
                id_cliente: '',
                index: -1
            });
        } else {
            setActiveActivity({ ...formData.detalles_agenda[index], index });
        }
        setIsActivityModalOpen(true);
    };

    const sortedAgenda = (dia) => {
        return formData.detalles_agenda
            .map((act, originalIndex) => ({ ...act, originalIndex }))
            .filter(act => act.dia_semana === dia)
            .sort((a, b) => a.hora_programada.localeCompare(b.hora_programada));
    };

    const daysOfWeek = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const payload = {
                id_empleado: formData.id_empleado,
                fecha_inicio_semana: formData.fecha_inicio_semana,
                fecha_fin_semana: formData.fecha_fin_semana,
                meta_visitas: formData.meta_visitas,
                meta_visitas_asistidas: formData.meta_visitas_asistidas,
                meta_llamadas: formData.meta_llamadas,
                meta_emails: formData.meta_emails,
                detalles_agenda: formData.detalles_agenda
            };
            await planService.create(payload, formData.id_empleado);
            onSuccess?.();
            if (isPage) {
                window.location.href = '/planes';
            } else {
                onClose?.();
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen && !isPage) return null;

    const steps = [
        { n: 1, label: 'Definir Metas', icon: <Target size={18} /> },
        { n: 2, label: 'Planificar Agenda', icon: <ClipboardList size={18} /> },
        { n: 3, label: 'Resumen Final', icon: <CheckCircle size={18} /> }
    ];

    if (isPage) {
        return (
            <div className="wizard-page-view">
                <div className="p-noise-overlay" />

                <PageHeader
                    title="Propuesta de Plan Semanal"
                    description="Configure sus objetivos y distribuya sus actividades comerciales para el periodo seleccionado."
                    icon={Calendar}
                    breadcrumb={['Apps', 'Planes', 'Nueva Propuesta']}
                    actions={
                        <button className="btn-cancel-elite" onClick={() => window.location.href = '/planes'}>
                            <X size={16} />
                            <span>Descartar y Salir</span>
                        </button>
                    }
                />

                <div className="wizard-premium-layout">
                    {/* Horizontal Stepper Refined */}
                    <div className="stepper-modern-wrap">
                        <div className="stepper-horizontal">
                            {steps.map((s, idx) => (
                                <React.Fragment key={s.n}>
                                    <div className={`step-node ${step === s.n ? 'active' : ''} ${step > s.n ? 'completed' : ''}`} onClick={() => step > s.n && setStep(s.n)}>
                                        <div className="node-outer">
                                            <div className="node-inner">
                                                {step > s.n ? <CheckCircle size={18} /> : s.icon}
                                            </div>
                                        </div>
                                        <div className="node-content">
                                            <span className="node-step">PASO 0{s.n}</span>
                                            <span className="node-label">{s.label}</span>
                                        </div>
                                    </div>
                                    {idx < steps.length - 1 && (
                                        <div className={`step-line ${step > s.n ? 'filled' : ''}`} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    <div className="wizard-main-container">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4, ease: "circOut" }}
                                className="step-dynamic-content"
                            >
                                {step === 1 && (
                                    <div className="step-goals-view">
                                        <div className="config-top-bar">
                                            <div className="plan-user-elite-card">
                                                <div className="user-avatar-premium">
                                                    {user?.nombre_completo?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                </div>
                                                <div className="user-text-meta">
                                                    <span className="label">Responsable del Plan</span>
                                                    <h4>{user?.nombre_completo}</h4>
                                                    <Badge variant="info" className="role-badge">{user?.cargo || 'Asesor Comercial'}</Badge>
                                                </div>
                                            </div>

                                            <div className="week-selector-premium">
                                                <div className="selector-title">
                                                    <Calendar size={14} />
                                                    <span>Periodo de Programación</span>
                                                </div>
                                                <WeekPicker
                                                    plans={availableWeeks.map(w => ({
                                                        id_plan: w.monday,
                                                        fecha_inicio_semana: w.monday,
                                                        estado: 'Nuevo'
                                                    }))}
                                                    selectedPlanId={formData.fecha_inicio_semana}
                                                    onChange={(monday) => {
                                                        const selected = availableWeeks.find(w => w.monday === monday);
                                                        if (selected) {
                                                            setFormData({
                                                                ...formData,
                                                                fecha_inicio_semana: selected.monday,
                                                                fecha_fin_semana: selected.saturday
                                                            });
                                                        }
                                                    }}
                                                    isAdmin={false}
                                                />
                                            </div>
                                        </div>

                                        <div className="section-divider">
                                            <span>Metas de Cumplimiento</span>
                                            <div className="line" />
                                        </div>

                                        <div className="metas-elite-grid">
                                            <GoalInputCard
                                                icon={Briefcase}
                                                title="Visitas Presenciales"
                                                subtitle="Objetivo de clientes a visitar físicamente"
                                                color="emerald"
                                                value={formData.meta_visitas}
                                                onChange={(v) => setFormData({ ...formData, meta_visitas: v })}
                                            />
                                            <GoalInputCard
                                                icon={Users}
                                                title="Visitas Asistidas"
                                                subtitle="Requerimientos de acompañamiento"
                                                color="indigo"
                                                value={formData.meta_visitas_asistidas}
                                                onChange={(v) => setFormData({ ...formData, meta_visitas_asistidas: v })}
                                            />
                                            <GoalInputCard
                                                icon={Phone}
                                                title="Llamadas Prospecto"
                                                subtitle="Llamadas de telemarketing y seguimiento"
                                                color="blue"
                                                value={formData.meta_llamadas}
                                                onChange={(v) => setFormData({ ...formData, meta_llamadas: v })}
                                            />
                                            <GoalInputCard
                                                icon={Mail}
                                                title="Emails y Propuestas"
                                                subtitle="Gestión de correo y envíos formales"
                                                color="amber"
                                                value={formData.meta_emails}
                                                onChange={(v) => setFormData({ ...formData, meta_emails: v })}
                                            />
                                        </div>

                                        {availableWeeks.length === 0 && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="empty-weeks-warning"
                                            >
                                                <AlertCircle size={32} />
                                                <div className="warning-text">
                                                    <h4>Periodos Completados</h4>
                                                    <p>Ya has registrado planes para todas las semanas disponibles en este momento. Vuelve el sábado para planificar la siguiente semana.</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="step-agenda-view">
                                        <div className="agenda-header-premium">
                                            <div className="text">
                                                <div className="title-with-badge">
                                                    <h3>Planificación Táctica</h3>
                                                    <span className="premium-status">Elite Edition</span>
                                                </div>
                                                <p>Distribuya sus actividades comerciales con precisión estratégica.</p>
                                            </div>
                                            <div className="calendar-legend-premium">
                                                <div className="legend-p"><span className="dot v" /> Venta</div>
                                                <div className="legend-p"><span className="dot c" /> Llamada</div>
                                                <div className="legend-p"><span className="dot a" /> Asistida</div>
                                            </div>
                                        </div>

                                        <div className="tactical-board-elite">
                                            {daysOfWeek.map(dia => {
                                                const dayActivities = sortedAgenda(dia);
                                                return (
                                                    <div key={dia} className="board-column">
                                                        <div className="column-head">
                                                            <div className="day-meta">
                                                                <span className="day-name">{dia}</span>
                                                                <span className="activity-count">{dayActivities.length}</span>
                                                            </div>
                                                            <button className="add-float-btn" onClick={() => handleOpenActivityModal(dia)}>
                                                                <Plus size={18} />
                                                            </button>
                                                        </div>

                                                        <div className="activities-drop-zone">
                                                            {dayActivities.map((act) => (
                                                                <motion.div
                                                                    key={act.originalIndex}
                                                                    whileHover={{ scale: 1.02, y: -2 }}
                                                                    className={`agenda-ticket-elite ${act.tipo_actividad.toLowerCase().replace(' ', '-')}`}
                                                                    onClick={() => handleOpenActivityModal(dia, act.originalIndex)}
                                                                >
                                                                    <div className="ticket-accent" />
                                                                    <div className="ticket-body">
                                                                        <div className="ticket-header">
                                                                            <span className="tick-time">{act.hora_programada}</span>
                                                                            <span className="tick-icon">
                                                                                {act.tipo_actividad === 'Visita' ? <Building2 size={12} /> :
                                                                                    act.tipo_actividad === 'Llamada' ? <Phone size={12} /> :
                                                                                        act.tipo_actividad === 'Correo' ? <Mail size={12} /> : <Users size={12} />}
                                                                            </span>
                                                                        </div>
                                                                        <div className="tick-client">
                                                                            {clientes.find(c => c.id_cliente === act.id_cliente)?.nombre_razon_social || 'Seleccionar Cliente'}
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            ))}
                                                            {dayActivities.length === 0 && (
                                                                <div className="empty-column-state">
                                                                    <div className="empty-dash" />
                                                                    <span>Disponible</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Activity Quick Modal - Full Redesign */}
                                        <AnimatePresence>
                                            {isActivityModalOpen && activeActivity && (
                                                <div className="modal-root-overlay">
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 30, scale: 0.95 }}
                                                        className="elite-action-modal"
                                                    >
                                                        <div className="modal-header-glass">
                                                            <div className="m-header-left">
                                                                <div className="m-icon-square">
                                                                    <Activity size={20} />
                                                                </div>
                                                                <div className="m-title-stack">
                                                                    <h4>{activeActivity.index === -1 ? 'Nueva Actividad' : 'Gestión de Actividad'}</h4>
                                                                    <span>{activeActivity.dia_semana} comercial</span>
                                                                </div>
                                                            </div>
                                                            <button className="m-close-circular" onClick={() => setIsActivityModalOpen(false)}>
                                                                <X size={20} />
                                                            </button>
                                                        </div>

                                                        <div className="modal-content-elite">
                                                            <div className="elite-form-row">
                                                                <div className="elite-field half">
                                                                    <label><Clock size={12} /> Horario Programado</label>
                                                                    <div className="time-input-container">
                                                                        <input
                                                                            type="time"
                                                                            value={activeActivity.hora_programada}
                                                                            onChange={(e) => setActiveActivity({ ...activeActivity, hora_programada: e.target.value })}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="elite-field half">
                                                                    <label><Target size={12} /> Categoría</label>
                                                                    <select
                                                                        className="elite-select"
                                                                        value={activeActivity.tipo_actividad}
                                                                        onChange={(e) => setActiveActivity({ ...activeActivity, tipo_actividad: e.target.value })}
                                                                    >
                                                                        <option value="Visita">🛒 Visita de Negocios</option>
                                                                        <option value="Llamada">📞 Seguimiento Telefónico</option>
                                                                        <option value="Visita asistida">🤝 Soporte Técnico / Acompañamiento</option>
                                                                        <option value="Correo">✉️ Gestión Documentaria / Email</option>
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            <div className="elite-field">
                                                                <label><Building2 size={12} /> Cliente o Prospecto Asociado</label>
                                                                <div className="client-select-wrapper-elite">
                                                                    <ClientSearchSelect
                                                                        clientes={clientes}
                                                                        value={activeActivity.id_cliente}
                                                                        onChange={(val) => setActiveActivity({ ...activeActivity, id_cliente: val })}
                                                                        onOpenNuevo={() => setIsNuevoClienteOpen(true)}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="modal-footer-glass">
                                                            {activeActivity.index !== -1 && (
                                                                <button
                                                                    className="btn-trash-elite"
                                                                    onClick={() => { handleRemoveActivity(activeActivity.index); setIsActivityModalOpen(false); }}
                                                                >
                                                                    <Trash2 size={18} />
                                                                    <span>Eliminar</span>
                                                                </button>
                                                            )}
                                                            <div className="flex-spacer" />
                                                            <button
                                                                className="btn-primary-confirm"
                                                                disabled={!activeActivity.id_cliente}
                                                                onClick={() => {
                                                                    if (activeActivity.index === -1) {
                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            detalles_agenda: [...prev.detalles_agenda, {
                                                                                dia_semana: activeActivity.dia_semana,
                                                                                hora_programada: activeActivity.hora_programada,
                                                                                tipo_actividad: activeActivity.tipo_actividad,
                                                                                id_cliente: activeActivity.id_cliente
                                                                            }]
                                                                        }));
                                                                    } else {
                                                                        const up = [...formData.detalles_agenda];
                                                                        up[activeActivity.index] = {
                                                                            dia_semana: activeActivity.dia_semana,
                                                                            hora_programada: activeActivity.hora_programada,
                                                                            tipo_actividad: activeActivity.tipo_actividad,
                                                                            id_cliente: activeActivity.id_cliente
                                                                        };
                                                                        setFormData(prev => ({ ...prev, detalles_agenda: up }));
                                                                    }
                                                                    setIsActivityModalOpen(false);
                                                                }}
                                                            >
                                                                <Save size={18} />
                                                                <span>{activeActivity.index === -1 ? 'Programar Actividad' : 'Actualizar Cambios'}</span>
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                </div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="step-summary-view">
                                        <div className="summary-hero-card">
                                            <div className="hero-content">
                                                <div className="badge-confirm">
                                                    <CheckCircle size={14} />
                                                    <span>Propuesta Lista</span>
                                                </div>
                                                <h3>Confirmación de Plan Semanal</h3>
                                                <p>Verifique los detalles antes de enviar su propuesta a revisión.</p>
                                            </div>
                                            <div className="hero-week-info">
                                                <Calendar size={18} />
                                                <div className="text">
                                                    <span className="label">Periodo</span>
                                                    <span className="val">{availableWeeks.find(w => w.monday === formData.fecha_inicio_semana)?.label || 'Semana seleccionada'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="summary-grid">
                                            <div className="summary-stats-column">
                                                <div className="stats-header">BALANCE DE METAS</div>
                                                <div className="stat-progress-list">
                                                    <StatRow label="Visitas" current={formData.detalles_agenda.filter(a => a.tipo_actividad === 'Visita').length} target={formData.meta_visitas} color="#10b981" />
                                                    <StatRow label="Asistidas" current={formData.detalles_agenda.filter(a => a.tipo_actividad === 'Visita asistida').length} target={formData.meta_visitas_asistidas} color="#6366f1" />
                                                    <StatRow label="Llamadas" current={formData.detalles_agenda.filter(a => a.tipo_actividad === 'Llamada').length} target={formData.meta_llamadas} color="#3b82f6" />
                                                    <StatRow label="Emails" current={formData.detalles_agenda.filter(a => a.tipo_actividad === 'Correo').length} target={formData.meta_emails} color="#f59e0b" />
                                                </div>

                                                <div className="summary-notice">
                                                    <AlertTriangle size={18} />
                                                    <p>Al finalizar, el Director Comercial recibirá una notificación para la aprobación de sus actividades.</p>
                                                </div>
                                            </div>

                                            <div className="summary-agenda-column">
                                                <div className="stats-header">VISTA PREVIA DE AGENDA</div>
                                                <div className="agenda-preview-list">
                                                    {[...formData.detalles_agenda].sort((a, b) => {
                                                        const daysArr = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
                                                        if (daysArr.indexOf(a.dia_semana) !== daysArr.indexOf(b.dia_semana)) return daysArr.indexOf(a.dia_semana) - daysArr.indexOf(b.dia_semana);
                                                        return a.hora_programada.localeCompare(b.hora_programada);
                                                    }).map((act, i) => (
                                                        <div key={i} className="preview-item">
                                                            <div className="time">{act.hora_programada}</div>
                                                            <div className="day">{act.dia_semana.slice(0, 3)}</div>
                                                            <div className="type">{act.tipo_actividad}</div>
                                                            <div className="client">{clientes.find(c => c.id_cliente === parseInt(act.id_cliente))?.nombre_cliente || 'Sin cliente'}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        <div className="wizard-navigation-bar">
                            {step > 1 ? (
                                <button className="btn-nav-prev" onClick={prevStep}>
                                    <ChevronLeft size={20} />
                                    <span>Paso Anterior</span>
                                </button>
                            ) : (
                                <button className="btn-nav-prev cancel-mode" onClick={() => window.location.href = '/planes'}>
                                    <X size={20} />
                                    <span>Cancelar Propuesta</span>
                                </button>
                            )}
                            <div className="flex-spacer" />
                            {step < 3 ? (
                                <button
                                    className="btn-nav-next"
                                    onClick={nextStep}
                                    disabled={!formData.fecha_inicio_semana || availableWeeks.length === 0}
                                >
                                    <span>Siguiente Paso</span>
                                    <ChevronRight size={20} />
                                </button>
                            ) : (
                                <button className="btn-nav-submit" onClick={handleSubmit} disabled={loading}>
                                    {loading ? <LoadingSpinner size="sm" color="white" inline /> : (
                                        <>
                                            <span>Finalizar y Enviar Propuesta</span>
                                            <CheckCircle size={20} />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <NuevoClienteModal
                    isOpen={isNuevoClienteOpen}
                    onClose={() => setIsNuevoClienteOpen(false)}
                    onSave={() => formData.id_empleado && fetchClientes(formData.id_empleado)}
                />

                <style jsx>{`
                    .wizard-page-view {
                        display: flex;
                        flex-direction: column;
                        width: 100%;
                        max-width: 1400px;
                        margin: 0 auto;
                        position: relative;
                        min-height: 100vh;
                        padding: 2rem 2rem 1px 2rem;
                    }

                    .p-noise-overlay {
                        position: fixed;
                        inset: 0;
                        z-index: -1;
                        opacity: 0.015;
                        pointer-events: none;
                        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
                    }

                    .wizard-premium-layout {
                        display: flex;
                        flex-direction: column;
                        gap: 2rem;
                        animation: fadeIn 0.6s ease-out;
                    }

                    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

                    /* Stepper Modern Refined */
                    .stepper-modern-wrap {
                        background: rgba(255, 255, 255, 0.5);
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255, 255, 255, 0.6);
                        border-radius: 20px;
                        padding: 1.25rem 2.5rem;
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
                    }

                    .stepper-horizontal {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 1.5rem;
                    }

                    .step-node {
                        display: flex;
                        align-items: center;
                        gap: 1.25rem;
                        position: relative;
                        z-index: 1;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        cursor: default;
                    }

                    .step-node.completed { cursor: pointer; }
                    .step-node.active .node-outer { transform: scale(1.05); box-shadow: 0 0 0 5px rgba(14, 165, 233, 0.1); border-color: #0ea5e9; background: #0ea5e9; color: white; }

                    .node-outer {
                        width: 42px; height: 42px; border-radius: 12px;
                        background: white; border: 1.5px solid #e2e8f0;
                        display: flex; align-items: center; justify-content: center;
                        transition: all 0.3s;
                        flex-shrink: 0;
                    }

                    .step-node.completed .node-outer { border-color: #10b981; background: #10b981; color: white; }

                    .node-content { display: flex; flex-direction: column; line-height: 1.1; }
                    .node-step { font-size: 0.6rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 2px; }
                    .node-label { font-size: 0.9rem; font-weight: 800; color: #1e293b; white-space: nowrap; }
                    .step-node.active .node-label { color: #0ea5e9; }
                    .step-node.completed .node-label { color: #10b981; }

                    .step-line {
                        flex: 1;
                        height: 2px;
                        background: #e2e8f0;
                        position: relative;
                        top: 0;
                    }
                    .step-line::after {
                        content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 0;
                        background: #10b981; transition: width 0.6s ease-in-out;
                    }
                    .step-line.filled::after { width: 100%; }

                    /* Config Top Bar */
                    .config-top-bar {
                        display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: stretch;
                        margin-bottom: 2rem;
                    }

                    .plan-user-elite-card, .week-selector-premium {
                        background: white; border: 1px solid #e2e8f0; border-radius: 20px;
                        padding: 1.25rem 1.75rem; display: flex; align-items: center; gap: 1.25rem;
                        box-shadow: var(--shadow-sm); min-height: 110px;
                    }

                    .user-avatar-premium {
                        width: 54px; height: 54px; border-radius: 16px; background: #1e293b;
                        color: white; display: flex; align-items: center; justify-content: center;
                        font-size: 1.15rem; font-weight: 800; box-shrink: 0;
                    }

                    .week-selector-premium { flex-direction: column; align-items: flex-start; gap: 8px; justify-content: center; }

                    .user-text-meta h4 { font-size: 1.15rem; font-weight: 800; color: #1e293b; margin: 2px 0 6px 0; }
                    .user-text-meta .label { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
                    :global(.role-badge) { font-size: 0.7rem; padding: 4px 10px; border-radius: 50px; font-weight: 800; }

                    .week-selector-premium {
                        background: white; border: 1px solid #e2e8f0; border-radius: 24px;
                        padding: 1.5rem 2rem; display: flex; flex-direction: column; gap: 10px;
                        box-shadow: var(--shadow-sm);
                    }
                    .selector-title { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; }

                    .section-divider {
                        display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem;
                    }
                    .section-divider span { font-size: 0.9rem; font-weight: 900; color: #1e293b; text-transform: uppercase; letter-spacing: 0.1em; white-space: nowrap; }
                    .section-divider .line { height: 1px; flex: 1; background: linear-gradient(90deg, #e2e8f0, transparent); }

                    /* Metas Elite Grid */
                    .metas-elite-grid {
                        display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;
                    }

                    /* Agenda Step */
                    .agenda-header-premium {
                        display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem;
                    }
                    .agenda-header-premium h3 { font-size: 1.8rem; font-weight: 900; color: #1e293b; margin-bottom: 4px; letter-spacing: -0.02em; }
                    .agenda-header-premium p { color: #64748b; font-size: 1rem; margin: 0; }
                    
                    .day-quick-actions { display: flex; gap: 8px; flex-wrap: wrap; }
                    .btn-add-day {
                        padding: 8px 16px; background: white; border: 1.5px solid #e2e8f0; border-radius: 12px;
                        font-size: 0.8rem; font-weight: 800; display: flex; align-items: center; gap: 8px;
                        color: #1e293b; transition: all 0.2s; cursor: pointer;
                    }
                    .btn-add-day:hover { border-color: #0ea5e9; color: #0ea5e9; background: #f0f9ff; transform: translateY(-2px); }

                    .agenda-glass-container {
                        background: rgba(255, 255, 255, 0.4); border: 1.5px solid rgba(255, 255, 255, 0.8);
                        border-radius: 28px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.02);
                    }
                    .agenda-list-header {
                        display: grid; grid-template-columns: 80px 140px 180px 1fr 60px;
                        background: rgba(241, 245, 249, 0.8); padding: 1.25rem 1.5rem;
                        font-size: 0.75rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;
                    }

                    .agenda-items-scroll { max-height: 600px; overflow-y: auto; padding: 1.25rem; display: flex; flex-direction: column; gap: 12px; }
                    .agenda-row-elite {
                        display: grid; grid-template-columns: 80px 140px 180px 1fr 60px; align-items: center;
                        background: white; border: 1px solid #e2e8f0; padding: 10px 1.5rem;
                        border-radius: 20px; transition: all 0.2s;
                    }
                    .agenda-row-elite:hover { border-color: #0ea5e9; box-shadow: 0 10px 20px -5px rgba(0,0,0,0.05); transform: scale(1.005); }

                    .day-tag {
                        background: #eff6ff; color: #0ea5e9; font-weight: 900; font-size: 0.75rem;
                        padding: 6px 12px; border-radius: 50px; text-transform: uppercase; width: fit-content;
                    }
                    .time-input-wrap {
                        display: flex; align-items: center; gap: 8px; color: #64748b; font-weight: 700;
                    }
                    .time-input-wrap input { border: none; outline: none; background: transparent; font-size: 0.95rem; font-weight: 800; color: #1e293b; width: 100%; }
                    
                    .select-premium {
                        background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;
                        padding: 8px 12px; font-size: 0.9rem; font-weight: 700; color: #1e293b; outline: none; transition: all 0.2s;
                    }
                    .select-premium:focus { border-color: #0ea5e9; box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1); }

                    .btn-remove-elite {
                        width: 36px; height: 36px; border-radius: 10px; border: none;
                        background: #fee2e2; color: #ef4444; display: flex; align-items: center; justify-content: center;
                        cursor: pointer; transition: all 0.2s;
                    }
                    .btn-remove-elite:hover { background: #ef4444; color: white; transform: rotate(8deg); }

                    /* Summary Step */
                    .summary-hero-card {
                        background: #1e293b; color: white; padding: 2.5rem 3rem; border-radius: 32px;
                        display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem;
                        position: relative; overflow: hidden;
                    }
                    .summary-hero-card::after {
                        content: ''; position: absolute; right: -50px; top: -50px; width: 200px; height: 200px;
                        background: #0ea5e9; filter: blur(100px); opacity: 0.2;
                    }
                    .badge-confirm {
                        display: flex; align-items: center; gap: 8px; background: rgba(16, 185, 129, 0.2);
                        color: #10b981; padding: 6px 14px; border-radius: 50px; font-size: 0.75rem; font-weight: 800; width: fit-content; margin-bottom: 1rem;
                    }
                    .summary-hero-card h3 { font-size: 2.2rem; font-weight: 900; margin: 0 0 8px 0; letter-spacing: -0.03em; }
                    .summary-hero-card p { opacity: 0.7; font-size: 1.1rem; margin: 0; }

                    .hero-week-info {
                        display: flex; align-items: center; gap: 1rem; background: rgba(255,255,255,0.05);
                        padding: 1.25rem 1.75rem; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1);
                    }
                    .hero-week-info .label { font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
                    .hero-week-info .val { font-size: 1.1rem; font-weight: 800; display: block; }

                    .summary-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 2.5rem; }
                    .stats-header { font-size: 0.8rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 1.5rem; }
                    .stat-progress-list { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2.5rem; }
                    
                    .summary-notice {
                        background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 20px; padding: 1.5rem;
                        display: flex; gap: 1rem; color: #be185d;
                    }
                    .summary-notice p { font-size: 0.85rem; font-weight: 700; margin: 0; line-height: 1.5; }

                    .agenda-preview-list { display: flex; flex-direction: column; gap: 10px; }
                    .preview-item {
                        display: grid; grid-template-columns: 70px 50px 100px 1fr; align-items: center; gap: 15px;
                        padding: 1rem 1.5rem; background: white; border: 1px solid #e2e8f0; border-radius: 18px;
                    }
                    .preview-item .time { font-weight: 900; color: #1e293b; font-size: 1rem; }
                    .preview-item .day { color: #0ea5e9; font-weight: 900; font-size: 0.75rem; text-transform: uppercase; }
                    .preview-item .type { font-weight: 800; font-size: 0.85rem; color: #64748b; }
                    .preview-item .client { font-weight: 800; color: #1e293b; }

                    /* Navigation Bar - Floating Elite Dock */
                    .wizard-navigation-bar {
                        position: sticky; 
                        bottom: 2rem; 
                        margin-top: 4rem;
                        background: rgba(255, 255, 255, 0.85); 
                        backdrop-filter: blur(25px);
                        border: 1px solid rgba(255, 255, 255, 0.5);
                        border-radius: 24px;
                        padding: 1.25rem 2.5rem; 
                        display: flex; 
                        align-items: center; 
                        z-index: 1000;
                        box-shadow: 0 25px 50px -12px rgba(0,0,0,0.12), 0 0 0 1px rgba(226, 232, 240, 0.8);
                        width: calc(100% - 4rem);
                        margin-left: auto;
                        margin-right: auto;
                        margin-bottom: 2rem;
                    }
                    .btn-nav-prev {
                        display: flex; align-items: center; gap: 10px; background: #f1f5f9; border: 1.5px solid #e2e8f0;
                        color: #1e293b; font-weight: 800; cursor: pointer; transition: all 0.2s;
                        padding: 0.75rem 1.75rem; border-radius: 14px;
                    }
                    .btn-nav-prev:hover { background: #e2e8f0; border-color: #cbd5e1; transform: translateX(-4px); }
                    .btn-nav-prev.cancel-mode { color: #94a3b8; background: transparent; border: 1.5px dashed #e2e8f0; }
                    .btn-nav-prev.cancel-mode:hover { color: #ef4444; background: #fee2e2; border-color: #ef4444; border-style: solid; transform: none; }

                    .btn-nav-next, .btn-nav-submit {
                        height: 52px; padding: 0 2.5rem; border-radius: 16px; border: none;
                        display: flex; align-items: center; gap: 12px; font-weight: 800; cursor: pointer;
                        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    }
                    .btn-nav-next { background: #1e293b; color: white; box-shadow: 0 10px 15px -3px rgba(30, 41, 59, 0.2); }
                    .btn-nav-next:hover { transform: scale(1.03) translateX(4px); background: #0ea5e9; }
                    .btn-nav-submit { background: #10b981; color: white; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3); }
                    .btn-nav-submit:hover { transform: scale(1.03); box-shadow: 0 20px 25px -5px rgba(16, 185, 129, 0.4); }

                    .btn-cancel-elite {
                        display: flex; align-items: center; gap: 8px; background: #fff1f2; color: #e11d48;
                        padding: 0 1.25rem; height: 44px; border-radius: 12px; border: 1.5px solid transparent; font-weight: 800;
                        font-size: 0.85rem; cursor: pointer; transition: all 0.2s;
                        margin-top: 10px;
                    }
                    .btn-cancel-elite:hover { background: #e11d48; color: white; border-color: #e11d48; }

                    .flex-spacer { flex: 1; }

                    /* Tactical Board Elite */
                    .tactical-board-elite {
                        display: grid; grid-template-columns: repeat(6, 1fr); gap: 1.25rem;
                        padding-bottom: 2rem;
                    }
                    .board-column {
                        background: rgba(255, 255, 255, 0.3); backdrop-filter: blur(5px);
                        border-radius: 28px; border: 1px solid rgba(226, 232, 240, 0.6);
                        display: flex; flex-direction: column; min-height: 500px;
                        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1);
                    }
                    .board-column:hover { background: rgba(255, 255, 255, 0.6); border-color: #0ea5e9; transform: translateY(-5px); box-shadow: 0 15px 35px rgba(0,0,0,0.03); }

                    .column-head {
                        padding: 1.5rem; border-bottom: 1px dashed #e2e8f0;
                        display: flex; justify-content: space-between; align-items: center;
                    }
                    .day-meta { display: flex; flex-direction: column; gap: 4px; }
                    .day-name { font-size: 0.85rem; font-weight: 900; color: #1e293b; text-transform: uppercase; letter-spacing: 0.05em; }
                    .activity-count { font-size: 0.7rem; font-weight: 800; color: #0ea5e9; background: #e0f2fe; width: fit-content; padding: 2px 10px; border-radius: 50px; }
                    
                    .add-float-btn {
                        width: 40px; height: 40px; border-radius: 14px; background: white; color: #1e293b;
                        border: 1.5px solid #e2e8f0; display: flex; align-items: center; justify-content: center; 
                        cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                    }
                    .add-float-btn:hover { background: #1e293b; color: white; border-color: #1e293b; transform: rotate(90deg); }

                    .activities-drop-zone { padding: 1.25rem; display: flex; flex-direction: column; gap: 12px; flex: 1; }
                    
                    .agenda-ticket-elite {
                        background: white; border-radius: 20px; border: 1px solid #e2e8f0;
                        position: relative; overflow: hidden; display: flex; cursor: pointer;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                    }
                    .ticket-accent { width: 5px; background: #94a3b8; }
                    .agenda-ticket-elite.visita .ticket-accent { background: #10b981; }
                    .agenda-ticket-elite.llamada .ticket-accent { background: #3b82f6; }
                    .agenda-ticket-elite.visita-asistida .ticket-accent { background: #6366f1; }
                    
                    .ticket-body { flex: 1; padding: 1rem 1.25rem; }
                    .ticket-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
                    .tick-time { font-size: 0.85rem; font-weight: 900; color: #1e293b; }
                    .tick-icon { color: #94a3b8; }
                    .tick-client { font-size: 0.75rem; font-weight: 700; color: #64748b; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

                    .empty-column-state {
                        display: flex; flex-direction: column; align-items: center; justify-content: center;
                        gap: 12px; flex: 1; opacity: 0.3; padding: 2rem 0;
                    }
                    .empty-dash { width: 20px; height: 2px; background: #64748b; border-radius: 2px; }
                    .empty-column-state span { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.1em; }

                    /* Activity Quick Modal - Elite Redesign */
                    .modal-root-overlay {
                        position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4);
                        backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center;
                        z-index: 10000; padding: 20px;
                    }
                    .elite-action-modal {
                        background: white; width: 100%; max-width: 580px; border-radius: 32px;
                        box-shadow: 0 40px 100px -20px rgba(0,0,0,0.3); position: relative;
                        border: 1px solid rgba(255,255,255,0.7);
                    }
                    .modal-header-glass {
                        padding: 1.75rem 2.5rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0;
                        display: flex; justify-content: space-between; align-items: center;
                        border-radius: 32px 32px 0 0;
                    }
                    .m-header-left { display: flex; align-items: center; gap: 1.25rem; }
                    .m-icon-square { 
                        width: 48px; height: 48px; border-radius: 14px; background: #1e293b; color: white;
                        display: flex; align-items: center; justify-content: center;
                    }
                    .m-title-stack h4 { margin: 0; font-size: 1.2rem; font-weight: 950; color: #1e293b; letter-spacing: -0.02em; }
                    .m-title-stack span { font-size: 0.85rem; color: #64748b; font-weight: 700; }
                    
                    .m-close-circular {
                        width: 36px; height: 36px; border-radius: 50%; background: white; border: 1px solid #e2e8f0;
                        color: #94a3b8; display: flex; align-items: center; justify-content: center; cursor: pointer;
                        transition: all 0.2s;
                    }
                    .m-close-circular:hover { background: #f1f5f9; color: #1e293b; transform: rotate(90deg); }

                    .modal-content-elite { padding: 2.5rem; display: flex; flex-direction: column; gap: 2rem; }
                    .elite-form-row { display: flex; gap: 1.5rem; }
                    .elite-field { display: flex; flex-direction: column; gap: 10px; flex: 1; }
                    .elite-field label { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 900; color: #1e293b; text-transform: uppercase; }
                    
                    .time-input-container input {
                        width: 100%; padding: 14px; border: 1.5px solid #e2e8f0; border-radius: 16px;
                        font-family: inherit; font-size: 1.1rem; font-weight: 900; color: #1e293b; outline: none; transition: border 0.2s;
                    }
                    .time-input-container input:focus { border-color: #0ea5e9; }
                    
                    .elite-select {
                        width: 100%; padding: 14px; border: 1.5px solid #e2e8f0; border-radius: 16px;
                        font-family: inherit; font-size: 0.9rem; font-weight: 800; color: #1e293b; outline: none; background: white;
                        appearance: none; cursor: pointer;
                    }
                    
                    .modal-footer-glass {
                        padding: 1.5rem 2.5rem; background: #f8fafc; border-top: 1px solid #e2e8f0;
                        display: flex; align-items: center; border-radius: 0 0 32px 32px;
                    }
                    .btn-trash-elite {
                        display: flex; align-items: center; gap: 8px; color: #ef4444; background: rgba(239, 68, 68, 0.05);
                        border: 1.5px solid rgba(239, 68, 68, 0.1); font-weight: 900; font-size: 0.85rem; cursor: pointer;
                        padding: 10px 18px; border-radius: 14px; transition: all 0.2s;
                    }
                    .btn-trash-elite:hover { background: #ef4444; color: white; border-color: #ef4444; }

                    .btn-primary-confirm {
                        padding: 12px 24px; background: #1e293b; color: white; border-radius: 16px;
                        border: none; font-weight: 900; font-size: 0.9rem; cursor: pointer;
                        display: flex; align-items: center; gap: 10px; transition: all 0.3s;
                        box-shadow: 0 10px 20px rgba(30, 41, 59, 0.2);
                    }
                    .btn-primary-confirm:hover:not(:disabled) { transform: scale(1.03); background: #0ea5e9; box-shadow: 0 15px 30px rgba(14, 165, 233, 0.3); }
                    .btn-primary-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

                    .agenda-header-premium { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; }
                    .title-with-badge { display: flex; align-items: center; gap: 1rem; margin-bottom: 8px; }
                    .title-with-badge h3 { margin: 0; font-size: 1.8rem; font-weight: 950; letter-spacing: -0.02em; color: #1e293b; }
                    .premium-status { background: #1e293b; color: white; font-size: 0.65rem; font-weight: 900; padding: 4px 10px; border-radius: 50px; text-transform: uppercase; letter-spacing: 0.1em; }
                    
                    .calendar-legend-premium { display: flex; gap: 1.5rem; }
                    .legend-p { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 850; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
                    .legend-p .dot { width: 8px; height: 8px; border-radius: 50%; }
                    .legend-p .dot.v { background: #10b981; }
                    .legend-p .dot.c { background: #3b82f6; }
                    .legend-p .dot.a { background: #6366f1; }

                    @media (max-width: 1400px) {
                        .tactical-board-elite { grid-template-columns: repeat(3, 1fr); }
                    }
                    @media (max-width: 900px) {
                        .tactical-board-elite { grid-template-columns: repeat(2, 1fr); }
                    }
                    @media (max-width: 600px) {
                        .tactical-board-elite { grid-template-columns: 1fr; }
                    }
                    .btn-delete-q {
                        display: flex; align-items: center; gap: 8px; color: #ef4444; background: transparent;
                        border: none; font-weight: 800; font-size: 0.85rem; cursor: pointer; transition: color 0.2s;
                    }
                    .btn-delete-q:hover { color: #dc2626; }

                    .btn-save-q {
                        padding: 10px 20px; background: #1e293b; color: white; border-radius: 12px;
                        border: none; font-weight: 800; font-size: 0.85rem; cursor: pointer;
                        display: flex; align-items: center; gap: 8px; transition: all 0.2s;
                    }
                    .btn-save-q:hover:not(:disabled) { background: #0ea5e9; transform: translateY(-2px); }
                    .btn-save-q:disabled { opacity: 0.5; cursor: not-allowed; }

                    .empty-weeks-warning {
                        margin-top: 3rem;
                        padding: 3rem;
                        background: rgba(239, 68, 68, 0.05);
                        border: 2px dashed rgba(239, 68, 68, 0.2);
                        border-radius: 24px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        text-align: center;
                        gap: 1.5rem;
                        color: #ef4444;
                    }
                    .empty-weeks-warning .warning-text h4 {
                        font-size: 1.25rem;
                        font-weight: 800;
                        margin: 0 0 0.5rem 0;
                        color: #1e293b;
                    }
                    :global(.dark) .empty-weeks-warning .warning-text h4 { color: white; }
                    .empty-weeks-warning .warning-text p {
                        font-size: 0.95rem;
                        font-weight: 500;
                        color: #64748b;
                        margin: 0;
                        max-width: 400px;
                    }

                    @media (max-width: 1024px) {
                        .config-top-bar, .summary-grid { grid-template-columns: 1fr; }
                        .wizard-navigation-bar { padding: 1.25rem 2rem; }
                    }
                `}</style>
            </div>
        );
    }

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
                            { n: 1, label: 'Metas Semanales', icon: <Target size={18} /> },
                            { n: 2, label: 'Planificación', icon: <ClipboardList size={18} /> },
                            { n: 3, label: 'Confirmación', icon: <CheckCircle size={18} /> }
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
                    {!isPage && <button className="close-btn" onClick={onClose}><X size={20} /></button>}

                    {step === 1 && (
                        <div className="wizard-header-context">
                            <div className="advisor-account-card-mini">
                                <div className="account-avatar">
                                    <div className="mini-avatar">
                                        {user?.nombre_completo?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="online-pulse"></div>
                                </div>
                                <div className="mini-info">
                                    <span className="mini-label">Planificador</span>
                                    <h4 className="mini-name">{user?.nombre_completo}</h4>
                                    <span className="mini-role">{user?.cargo || 'Asesor Comercial'}</span>
                                </div>
                            </div>

                            <div className="context-week-selection unified-picker-wrap">
                                <div className="context-label">
                                    <Calendar size={14} />
                                    <span>Periodo de Trabajo</span>
                                </div>
                                <WeekPicker
                                    plans={availableWeeks.map(w => ({
                                        id_plan: w.monday,
                                        fecha_inicio_semana: w.monday,
                                        estado: 'Nuevo'
                                    }))}
                                    selectedPlanId={formData.fecha_inicio_semana}
                                    headerText="Semanas Disponibles"
                                    onChange={(monday) => {
                                        const selected = availableWeeks.find(w => w.monday === monday);
                                        if (selected) {
                                            setFormData({
                                                ...formData,
                                                fecha_inicio_semana: selected.monday,
                                                fecha_fin_semana: selected.saturday
                                            });
                                        }
                                    }}
                                    isAdmin={false}
                                />
                            </div>
                        </div>
                    )}

                    <div className="wizard-main-content">
                        {step === 1 && (
                            <div className="wizard-step">
                                <h3>Definición de Metas</h3>
                                <p>Establece los objetivos de actividad para esta propuesta semanal.</p>

                                <div className="metas-dashboard-grid">
                                    <PremiumCard className="meta-card-premium visit" hover={true}>
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
                                    </PremiumCard>

                                    <PremiumCard className="meta-card-premium asistida" hover={true}>
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
                                    </PremiumCard>

                                    <PremiumCard className="meta-card-premium call" hover={true}>
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
                                    </PremiumCard>

                                    <PremiumCard className="meta-card-premium email" hover={true}>
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
                                    </PremiumCard>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="wizard-step agenda-step">
                                <h3>Planificación de Agenda</h3>
                                <p>Organiza las actividades diarias con los clientes.</p>

                                <div className="agenda-manager">
                                    <div className="days-nav">
                                        {['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'].map(dia => (
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
                                                        <option value="Visita">Visita</option>
                                                        <option value="Visita asistida">Visita Asistida</option>
                                                        <option value="Llamada">Llamada</option>
                                                        <option value="Correo">Email / Correo</option>
                                                    </select>
                                                </div>
                                                <div className="act-client-wrapper">
                                                    <ClientSearchSelect
                                                        clientes={clientes}
                                                        value={act.id_cliente}
                                                        onChange={(val) => handleUpdateActivity(index, 'id_cliente', val)}
                                                        onOpenNuevo={() => setIsNuevoClienteOpen(true)}
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
                                            <EmptyState
                                                icon={Clock}
                                                title="Agenda Vacía"
                                                message="Haz clic en los botones superiores para agregar actividades por día."
                                                compact
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="wizard-step summary-step-revamp">
                                <div className="summary-intro">
                                    <h3>Resumen del Plan de Trabajo</h3>
                                    <p>Propuesta final de cumplimiento y agenda para la semana seleccionada.</p>
                                </div>

                                <div className="summary-revamp-card">
                                    <div className="summary-user-header">
                                        <div className="summary-avatar">
                                            {user?.nombre_completo?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="summary-meta-info">
                                            <h4 className="user-displayName">{user?.nombre_completo}</h4>
                                            <div className="summary-date-badge">
                                                <Calendar size={14} />
                                                <span>{availableWeeks.find(w => w.monday === formData.fecha_inicio_semana)?.label || formData.fecha_inicio_semana}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="summary-stats-grid">
                                        <div className="sum-stat visit">
                                            <Briefcase size={16} />
                                            <div className="val-box">
                                                <span className="label">Visitas</span>
                                                <span className="count">{formData.detalles_agenda.filter(a => a.tipo_actividad === 'Visita').length} / {formData.meta_visitas}</span>
                                            </div>
                                        </div>
                                        <div className="sum-stat asistida">
                                            <Users size={16} />
                                            <div className="val-box">
                                                <span className="label">Asistidas</span>
                                                <span className="count">{formData.detalles_agenda.filter(a => a.tipo_actividad === 'Visita asistida').length} / {formData.meta_visitas_asistidas}</span>
                                            </div>
                                        </div>
                                        <div className="sum-stat call">
                                            <Phone size={16} />
                                            <div className="val-box">
                                                <span className="label">Llamadas</span>
                                                <span className="count">{formData.detalles_agenda.filter(a => a.tipo_actividad === 'Llamada').length} / {formData.meta_llamadas}</span>
                                            </div>
                                        </div>
                                        <div className="sum-stat email">
                                            <Mail size={16} />
                                            <div className="val-box">
                                                <span className="label">Emails</span>
                                                <span className="count">{formData.detalles_agenda.filter(a => a.tipo_actividad === 'Correo').length} / {formData.meta_emails}</span>
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
                                            {[...formData.detalles_agenda].sort((a, b) => {
                                                const daysArr = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
                                                if (daysArr.indexOf(a.dia_semana) !== daysArr.indexOf(b.dia_semana)) return daysArr.indexOf(a.dia_semana) - daysArr.indexOf(b.dia_semana);
                                                return a.hora_programada.localeCompare(b.hora_programada);
                                            }).map((act, i) => (
                                                <tr key={i}>
                                                    <td className="day-cell">{act.dia_semana}</td>
                                                    <td className="time-cell">{act.hora_programada}</td>
                                                    <td className="type-cell">
                                                        <span className={`badge-lite ${act.tipo_actividad === 'Visita' ? 'visit' : act.tipo_actividad === 'Llamada' ? 'call' : act.tipo_actividad === 'Correo' ? 'email' : 'asist'}`}>
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
                                                    <td colSpan="4" className="empty-row-lux">
                                                        <Activity size={24} />
                                                        <span>No has programado actividades para esta semana.</span>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="final-notice-bar">
                                    <AlertTriangle size={16} />
                                    <span>Al finalizar, este plan quedará guardado para revisión del Director Comercial.</span>
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
                        {step < 3 ? (
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
                                {loading ? <LoadingSpinner size="sm" color="white" inline /> : (
                                    <>
                                        <span>Finalizar y Crear Plan</span>
                                        <CheckCircle size={20} />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>

            <NuevoClienteModal
                isOpen={isNuevoClienteOpen}
                onClose={() => setIsNuevoClienteOpen(false)}
                onSave={() => formData.id_empleado && fetchClientes(formData.id_empleado)}
            />

            <style jsx>{`
                .wizard-page-container {
                    padding: 2rem 0;
                    display: flex;
                    justify-content: center;
                    width: 100%;
                }

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
                    z-index: 2000;
                    padding: 2rem;
                }

                .wizard-modal {
                    width: 100%;
                    max-width: 1100px;
                    height: 700px;
                    background: white;
                    border-radius: 30px;
                    display: flex;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }

                @media (max-width: 1024px) {
                    .wizard-modal {
                        flex-direction: column;
                        height: auto;
                        min-height: 90vh;
                        border-radius: 20px;
                    }
                    .wizard-sidebar {
                        width: 100%;
                        padding: 1.5rem;
                        flex-direction: row;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .wizard-logo { margin-bottom: 0; }
                    .steps-indicator { flex-direction: row; gap: 1rem; }
                    .step-text { display: none; }
                    .wizard-footer-note { display: none; }
                    .wizard-content-area { padding: 1.5rem; }
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
                    padding: 2.5rem 3.5rem;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    background: #f8fafc;
                    overflow: hidden;
                }

                .wizard-main-content { 
                    flex: 1; 
                    overflow-y: auto; 
                    padding-right: 1.5rem;
                    margin-bottom: 2rem;
                }

                .wizard-main-content::-webkit-scrollbar { width: 6px; }
                .wizard-main-content::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

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

                .wizard-header-context {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                    margin-bottom: 2.5rem;
                    align-items: center;
                    background: white;
                    padding: 1.25rem 2rem;
                    border-radius: 24px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
                    flex-shrink: 0;
                }

                .advisor-account-card-mini {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .mini-avatar {
                    width: 48px;
                    height: 48px;
                    background: #1e293b;
                    color: white;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    font-size: 1.1rem;
                }

                .mini-info { display: flex; flex-direction: column; }
                .mini-label { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
                .mini-name { font-size: 1rem; font-weight: 800; color: #1e293b; margin: 0; }
                .mini-role { font-size: 0.75rem; color: #64748b; font-weight: 600; }

                .context-week-selection {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .context-label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.7rem;
                    font-weight: 800;
                    color: #94a3b8;
                    text-transform: uppercase;
                    margin-left: 2px;
                }

                .unified-picker-wrap .week-picker-container { width: 100%; position: relative; z-index: 100; }
                .unified-picker-wrap .picker-trigger { 
                    background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 16px; 
                    height: 58px; width: 100%; padding: 0 1.25rem;
                    display: flex; align-items: center; justify-content: space-between;
                }
                .unified-picker-wrap .picker-trigger:hover { border-color: #0ea5e9; background: #f0f9ff; }
                
                .close-btn {
                    position: absolute;
                    top: 1.5rem;
                    right: 1.5rem;
                    background: #f1f5f9;
                    border: none;
                    color: #94a3b8;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    z-index: 10;
                }
                .close-btn:hover { background: #fee2e2; color: #ef4444; transform: rotate(90deg); }

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
                    padding: 1.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .meta-info { display: flex; align-items: center; gap: 1rem; }
                .meta-icon-box {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg-app);
                }

                .meta-card-premium.visit .meta-icon-box { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                .meta-card-premium.asistida .meta-icon-box { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
                .meta-card-premium.call .meta-icon-box { background: var(--primary-glow); color: var(--primary); }
                .meta-card-premium.email .meta-icon-box { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

                .meta-text { display: flex; flex-direction: column; }
                .meta-title { font-size: 0.95rem; font-weight: 800; color: var(--text-heading); letter-spacing: -0.01em; }
                .meta-desc { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }

                .meta-input-section { display: flex; align-items: baseline; gap: 6px; }
                .meta-input-section input {
                    width: 70px;
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: var(--text-heading);
                    border: none;
                    background: var(--bg-app);
                    border-radius: 10px;
                    padding: 4px 8px;
                    text-align: center;
                    outline: none;
                }

                .meta-unit { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }

                .agenda-manager { background: var(--bg-panel); border-radius: 24px; border: 1px solid var(--border-subtle); overflow: hidden; height: 420px; display: flex; flex-direction: column; box-shadow: var(--shadow-sm); }
                .days-nav { display: flex; gap: 10px; padding: 1.25rem; background: var(--bg-app); border-bottom: 1px solid var(--border-subtle); }
                .day-add-btn {
                    padding: 8px 16px;
                    background: var(--bg-panel);
                    border: 1px solid var(--border-subtle);
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: var(--text-muted);
                }
                .day-add-btn:hover { background: var(--bg-sidebar); color: white; border-color: var(--bg-sidebar); transform: translateY(-1px); }

                .activities-list { flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 10px; }
                .activity-row {
                    display: grid;
                    grid-template-columns: 60px 100px 120px 1fr 40px;
                    align-items: center;
                    gap: 15px;
                    padding: 8px 12px;
                    background: var(--bg-app);
                    border-radius: 14px;
                    transition: all 0.2s;
                }

                .activity-row:hover { background: var(--border-subtle); }

                .act-dia { font-weight: 800; color: var(--text-heading); font-size: 0.8rem; text-align: center; }
                .act-hora, .act-type { display: flex; align-items: center; gap: 8px; background: var(--bg-panel); padding: 6px 12px; border-radius: 10px; border: 1px solid var(--border-subtle); }
                .act-hora input, .act-type select { border: none; outline: none; background: none; font-size: 0.85rem; font-weight: 700; width: 100%; color: var(--text-heading); }
                .act-client-wrapper { width: 100%; position: relative; }

                .remove-act { border: none; background: none; color: var(--text-muted); cursor: pointer; }
                .remove-act:hover { color: var(--error); }

                .empty-agenda { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-muted); text-align: center; padding: 2rem; }

                .wizard-actions { display: flex; padding-top: 1.5rem; border-top: 1px solid #e2e8f0; margin-top: auto; }
                .spacer { flex: 1; }

                .btn-wizard-primary { 
                    background: #1e293b; color: white; border: none; padding: 0.85rem 2rem; border-radius: 16px; 
                    font-weight: 700; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.3s;
                }
                .btn-wizard-primary:hover { transform: translateX(5px); background: #0ea5e9; box-shadow: 0 10px 20px rgba(14, 165, 233, 0.2); }
                .btn-wizard-primary:disabled { opacity: 0.5; cursor: not-allowed; }

                .btn-wizard-secondary { 
                    background: white; color: #64748b; border: 1px solid #e2e8f0; padding: 0.85rem 1.5rem; border-radius: 16px; 
                    font-weight: 700; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s;
                }
                .btn-wizard-secondary:hover { background: #f8fafc; border-color: #cbd5e1; color: #1e293b; }

                .btn-wizard-success { 
                    background: #10b981; color: white; border: none; padding: 1rem 2.5rem; border-radius: 18px; 
                    font-weight: 800; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.3s;
                    box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);
                }
                .btn-wizard-success:hover { transform: scale(1.03); box-shadow: 0 20px 25px -5px rgba(16, 185, 129, 0.4); }

                /* Summary Revamp Styles */
                .summary-step-revamp { padding: 0.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
                .summary-intro h3 { font-size: 1.6rem; font-weight: 800; color: #1e293b; margin-bottom: 4px; }
                .summary-intro p { font-size: 0.95rem; color: #64748b; margin-bottom: 0; }
                
                .summary-revamp-card {
                    background: white;
                    border: 2px solid #e2e8f0;
                    border-radius: 24px;
                    padding: 2rem;
                    display: grid;
                    grid-template-columns: 1fr 1.5fr;
                    gap: 3rem;
                    align-items: center;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.03);
                }

                .summary-user-header { display: flex; align-items: center; gap: 1.25rem; }
                .summary-avatar { width: 60px; height: 60px; background: #1e293b; color: white; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.4rem; }
                .summary-meta-info { display: flex; flex-direction: column; gap: 4px; }
                .user-displayName { font-size: 1.2rem; font-weight: 800; color: #1e293b; margin: 0; }
                .summary-date-badge { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #0ea5e9; font-weight: 700; background: #f0f9ff; padding: 4px 12px; border-radius: 50px; width: fit-content; }

                .summary-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .sum-stat { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; }
                .sum-stat svg { opacity: 0.7; }
                .sum-stat.visit { color: #ef4444; background: rgba(239, 68, 68, 0.05); border-color: rgba(239, 68, 68, 0.1); }
                .sum-stat.asistida { color: #8b5cf6; background: rgba(139, 92, 246, 0.05); border-color: rgba(139, 92, 246, 0.1); }
                .sum-stat.call { color: #0ea5e9; background: rgba(14, 165, 233, 0.05); border-color: rgba(14, 165, 233, 0.1); }
                .sum-stat.email { color: #f59e0b; background: rgba(245, 158, 11, 0.05); border-color: rgba(245, 158, 11, 0.1); }

                .val-box { display: flex; flex-direction: column; }
                .val-box .label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.8; }
                .val-box .count { font-size: 0.95rem; font-weight: 800; }

                .agenda-review-list {
                    background: white; border: 2.5px solid #e2e8f0; border-radius: 20px; overflow: hidden;
                    margin-bottom: 1.5rem;
                }
                .summary-table { width: 100%; border-collapse: collapse; }
                .summary-table th { background: #f1f5f9; padding: 1rem; text-align: left; font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
                .summary-table td { padding: 1rem; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 0.9rem; font-weight: 600; }
                .summary-table tr:last-child td { border-bottom: none; }

                .day-cell { color: #0ea5e9; }
                .time-cell { color: #64748b; font-weight: 800; }
                .client-cell { color: #1e293b; }

                .badge-lite { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
                .badge-lite.visit { background: #fee2e2; color: #ef4444; }
                .badge-lite.call { background: #e0f2fe; color: #0ea5e9; }
                .badge-lite.email { background: #fef3c7; color: #f59e0b; }
                .badge-lite.asist { background: #ede9fe; color: #8b5cf6; }

                .empty-row-lux { padding: 3rem !important; text-align: center; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
                
                .final-notice-bar {
                    background: #fdf2f8; color: #be185d; padding: 1rem; border-radius: 16px; display: flex; align-items: center; gap: 12px; font-size: 0.85rem; font-weight: 700; border: 1px solid #fbcfe8;
                }

                .empty-row { text-align: center; color: var(--text-muted); padding: 3rem !important; font-style: italic; }

                .final-disclaimer {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 1rem 1.5rem;
                    background: var(--bg-app);
                    border-radius: 12px;
                    font-size: 0.9rem;
                    color: var(--text-muted);
                }

                .advisor-auto-info {
                    margin-bottom: 2rem;
                    padding: 1rem;
                    background: var(--bg-app);
                    border-radius: 12px;
                    border: 1px dashed var(--border-subtle);
                }

                .info-badge {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 0.9rem;
                    color: var(--text-heading);
                }

                .info-badge strong { color: var(--primary); }

                @media (max-height: 700px) {
                    .wizard-modal { height: 95vh; }
                    @keyframes spin { to { transform: rotate(360deg); } }
                }
            `}</style>
        </div>
    );
};

const GoalInputCard = ({ icon: Icon, title, subtitle, color, value, onChange }) => {
    return (
        <div className={`goal-card-premium ${color}`}>
            <div className="goal-icon-side">
                <Icon size={24} />
            </div>
            <div className="goal-content-side">
                <div className="goal-titles">
                    <h5>{title}</h5>
                    <p>{subtitle}</p>
                </div>
                <div className="goal-input-box">
                    <span className="goal-value">{value}</span>
                    <span className="unit">UNID.</span>
                </div>
            </div>

            <style jsx>{`
                .goal-card-premium {
                    background: white; border: 1px solid #e2e8f0; border-radius: 20px;
                    padding: 1.25rem 1.5rem; display: flex; align-items: center; gap: 1rem;
                    transition: all 0.2s ease;
                    box-shadow: var(--shadow-sm); position: relative; overflow: hidden;
                    height: 110px; /* Fixed height for consistency */
                    width: 100%;
                }
                .goal-card-premium:hover { border-color: #0ea5e9; background: #fafafa; }
                
                .goal-icon-side {
                    width: 48px; height: 48px; border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                
                .emerald .goal-icon-side { background: #ecfdf5; color: #10b981; }
                .indigo .goal-icon-side { background: #eef2ff; color: #6366f1; }
                .blue .goal-icon-side { background: #eff6ff; color: #3b82f6; }
                .amber .goal-icon-side { background: #fffbeb; color: #f59e0b; }

                .goal-content-side { 
                    flex: 1; display: grid; grid-template-columns: 1fr 100px; align-items: center; gap: 1rem; 
                    height: 100%;
                }
                
                .goal-titles { 
                    display: flex; flex-direction: column; justify-content: center;
                    overflow: hidden;
                }
                .goal-titles h5 { 
                    font-size: 0.95rem; font-weight: 800; color: #1e293b; margin: 0; line-height: 1.1;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .goal-titles p { 
                    font-size: 0.7rem; color: #64748b; font-weight: 600; margin: 4px 0 0 0; 
                    line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
                }

                .goal-input-box { 
                    width: 100px; height: 44px; display: flex; align-items: center; justify-content: center; gap: 4px;
                    background: #f8fafc; border-radius: 12px; border: 1.5px solid #e2e8f0; 
                }
                .goal-value {
                    font-size: 1.4rem; font-weight: 900; color: #1e293b;
                }
                .goal-input-box .unit { font-size: 0.6rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-top: 4px; }
            `}</style>
        </div>
    );
};

const StatRow = ({ label, current, target, color }) => {
    const percent = Math.min((current / (target || 1)) * 100, 100);
    return (
        <div className="stat-row-premium">
            <div className="stat-label-row">
                <span className="labelText">{label}</span>
                <span className="valueText"><strong>{current}</strong> / {target}</span>
            </div>
            <div className="stat-progress-bg">
                <motion.div
                    className="stat-progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    style={{ background: color }}
                />
            </div>
            <style jsx>{`
                .stat-row-premium { display: flex; flex-direction: column; gap: 8px; }
                .stat-label-row { display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 800; }
                .labelText { color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
                .valueText { color: #1e293b; }
                .stat-progress-bg { height: 6px; background: #e2e8f0; border-radius: 10px; overflow: hidden; }
                .stat-progress-fill { height: 100%; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default PlanWizard;
