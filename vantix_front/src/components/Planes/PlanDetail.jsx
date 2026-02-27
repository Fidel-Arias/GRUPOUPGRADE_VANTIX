import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    User,
    ChevronLeft,
    Clock,
    MapPin,
    Phone,
    Mail,
    Download,
    Target,
    Trophy,
    TrendingUp,
    Briefcase,
    ArrowRight,
    Send
} from 'lucide-react';
import { planService, empleadoService, authService, BASE_URL } from '../../services/api';
import PremiumCard from '../Common/PremiumCard';
import Badge from '../Common/Badge';
import LoadingSpinner from '../Common/LoadingSpinner';
import EmptyState from '../Common/EmptyState';
import AlertModal from '../Common/AlertModal';

const PlanDetail = ({ planId = null }) => {
    const [plan, setPlan] = useState(null);
    const [empleado, setEmpleado] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [reviewMode, setReviewMode] = useState(false);
    const [observations, setObservations] = useState('');
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

    useEffect(() => {
        const currentUser = authService.getUser();
        setUser(currentUser);

        let activeId = planId;
        if (!activeId && typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            activeId = params.get('id');
        }

        if (activeId) {
            fetchPlanData(activeId);
        } else {
            setLoading(false);
        }
    }, [planId]);

    const fetchPlanData = async (id) => {
        try {
            setLoading(true);
            const currentUser = authService.getUser();
            const data = await planService.getById(id);
            setPlan(data);

            if (data?.id_empleado) {
                if (currentUser && !currentUser.is_admin && currentUser.id_empleado === data.id_empleado) {
                    setEmpleado(currentUser);
                } else if (currentUser?.is_admin) {
                    const empData = await empleadoService.getAll();
                    const found = empData.find(e => e.id_empleado === data.id_empleado);
                    setEmpleado(found);
                }
            }
        } catch (error) {
            console.error('Error fetching plan in PlanDetail:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (newStatus) => {
        if (newStatus === 'Rechazado' && !observations.trim()) {
            setModal({
                isOpen: true,
                title: 'Observación requerida',
                message: 'Por favor, indica un motivo para el rechazo en las observaciones.',
                type: 'warning'
            });
            return;
        }

        try {
            setLoading(true);
            await planService.revisar(plan.id_plan, {
                estado: newStatus,
                observaciones_supervisor: observations
            });
            await fetchPlanData(plan.id_plan);
            setReviewMode(false);
            setModal({
                isOpen: true,
                title: newStatus === 'Aprobado' ? 'Plan Aprobado' : 'Plan Rechazado',
                message: `El plan ha sido actualizado a estado ${newStatus.toLowerCase()} exitosamente.`,
                type: 'success'
            });
        } catch (error) {
            setModal({
                isOpen: true,
                title: 'Error de actualización',
                message: 'Ocurrió un problema al actualizar el plan: ' + error.message,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSendForReview = async () => {
        try {
            setLoading(true);
            await planService.update(plan.id_plan, { estado: 'Enviado' });
            await fetchPlanData(plan.id_plan);
            setModal({
                isOpen: true,
                title: 'Plan Enviado',
                message: 'El plan ha sido enviado a revisión correctamente.',
                type: 'success'
            });
        } catch (error) {
            setModal({
                isOpen: true,
                title: 'Error al enviar',
                message: 'No se pudo enviar el plan a revisión: ' + error.message,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case 'Aprobado': return 'success';
            case 'Borrador': return 'default';
            case 'Cerrado': return 'info';
            case 'Rechazado': return 'error';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <div className="loading-page">
                <LoadingSpinner message="Sincronizando plan estratégico..." />
                <style jsx>{`
                    .loading-page { height: 70vh; display: flex; align-items: center; justify-content: center; }
                `}</style>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="error-container">
                <EmptyState
                    icon={Briefcase}
                    title="Plan no encontrado"
                    message="Parece que este registro ya no está disponible o el enlace es incorrecto."
                    actionLabel="Regresar al Listado"
                    onAction={() => window.location.href = '/planes'}
                />
                <style jsx>{`
                    .error-container { height: 70vh; display: flex; align-items: center; justify-content: center; }
                `}</style>
            </div>
        );
    }

    const activitiesByDay = plan.detalles_agenda?.reduce((acc, act) => {
        const day = act.dia_semana;
        if (!acc[day]) acc[day] = [];
        acc[day].push(act);
        return acc;
    }, {}) || {};

    const hasActivities = Object.keys(activitiesByDay).length > 0;

    return (
        <div className="plan-view-container">
            {/* Nav Bar Superior */}
            <div className="detail-nav">
                <button className="back-circle" onClick={() => window.location.href = '/planes'}>
                    <ChevronLeft size={24} />
                </button>
                <div className="nav-title-wrap">
                    <span className="nav-tag">REVISIÓN ESTRATÉGICA</span>
                    <h3 className="nav-title">Detalle de Plan Semanal</h3>
                </div>
                <div className="nav-actions">
                    <button className="btn-glass-icon" title="Descargar Reporte">
                        <Download size={20} />
                    </button>
                    {plan.estado === 'Borrador' && user?.id_empleado === plan.id_empleado && (
                        <button className="btn-action-premium" onClick={handleSendForReview}>
                            <Send size={18} />
                            <span>Enviar a revisión</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="plan-layout">
                <main className="plan-main">
                    {/* Header Card Premium */}
                    <PremiumCard className="hero-card" hover={false}>
                        <div className="hero-content">
                            <div className="profile-section">
                                <div className="avatar-gradient">
                                    <div className="avatar-inner">
                                        <User size={36} color="white" />
                                    </div>
                                    <div className="avatar-ring"></div>
                                </div>
                                <div className="profile-text">
                                    <div className="name-badge-wrap">
                                        <h1>{empleado?.nombre_completo || 'Asesor Comercial'}</h1>
                                        <Badge variant={getStatusVariant(plan.estado)}>
                                            {plan.estado}
                                        </Badge>
                                    </div>
                                    <p className="role-label">{empleado?.cargo || 'Especialista en Ventas'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="hero-stats-bar">
                            <div className="h-stat">
                                <Calendar size={20} />
                                <div>
                                    <label>Semana del Plan</label>
                                    <span>{new Date(plan.fecha_inicio_semana).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })} - {new Date(plan.fecha_fin_semana).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}</span>
                                </div>
                            </div>
                            <div className="h-stat-divider"></div>
                            <div className="h-stat">
                                <Target size={20} />
                                <div>
                                    <label>Objetivo Semanal</label>
                                    <span>{plan.detalles_agenda?.length || 0} Actividades Programadas</span>
                                </div>
                            </div>
                            <div className="h-stat-divider"></div>
                            <div className="h-stat">
                                <Clock size={20} />
                                <div>
                                    <label>Estado del Plan</label>
                                    <span style={{ color: 'var(--primary)' }}>{plan.estado}</span>
                                </div>
                            </div>
                        </div>
                    </PremiumCard>

                    {/* Timeline de Actividades */}
                    <div className="content-section">
                        <div className="section-header">
                            <div className="header-decoration"></div>
                            <h2>Cronograma Detallado</h2>
                            <p>Desglose diario de la hoja de ruta estratégica</p>
                        </div>

                        <div className="timeline-wrapper">
                            {hasActivities ? (
                                Object.entries(activitiesByDay).sort((a, b) => {
                                    const days = { 'Lunes': 1, 'Martes': 2, 'Miercoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sabado': 6 };
                                    return (days[a[0]] || 99) - (days[b[0]] || 99);
                                }).map(([day, acts], dayIdx) => (
                                    <motion.div
                                        key={day}
                                        initial={{ opacity: 0, x: -30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: dayIdx * 0.1 }}
                                        className="timeline-block"
                                    >
                                        <div className="timeline-marker">
                                            <div className="marker-circle"></div>
                                            <div className="marker-line"></div>
                                        </div>
                                        <div className="day-card">
                                            <div className="day-info">
                                                <h3>{day}</h3>
                                                <span className="act-count">{acts.length} actividades</span>
                                            </div>
                                            <div className="activities-grid">
                                                {acts.map((act, actIdx) => (
                                                    <div key={actIdx} className="act-detail-card">
                                                        <div className="act-icon-box" data-type={act.tipo_actividad}>
                                                            {(act.tipo_actividad === 'Visita' || act.tipo_actividad === 'Visita asistida') && <MapPin size={20} />}
                                                            {act.tipo_actividad === 'Llamada' && <Phone size={20} />}
                                                            {(act.tipo_actividad === 'Correo' || act.tipo_actividad === 'Email') && <Mail size={20} />}
                                                        </div>
                                                        <div className="act-body">
                                                            <div className="act-header">
                                                                <span className="act-type-label">{act.tipo_actividad}</span>
                                                                <span className="act-time-pill">Próxima</span>
                                                            </div>
                                                            <h4 className="act-client-name">{act.cliente?.nombre_cliente || 'Cliente no especificado'}</h4>
                                                            {act.observaciones && <p className="act-comment">{act.observaciones}</p>}
                                                        </div>
                                                        <button className="btn-act-more">
                                                            <ArrowRight size={18} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <EmptyState
                                    icon={Briefcase}
                                    title="Sin actividades programadas"
                                    message="Este plan de trabajo no contiene actividades para el periodo seleccionado. No es posible editar la agenda desde esta vista informativa."
                                />
                            )}
                        </div>
                    </div>
                </main>

                <aside className="plan-sidebar">
                    {/* Card de Metas */}

                    {/* Card de Indicaciones / Revisión */}
                    {(((plan.estado === 'Borrador' || plan.estado === 'Enviado') && user?.is_admin) || plan.observaciones_supervisor) && (
                        <PremiumCard className="sidebar-card directive-card" hover={false}>
                            <h3>Dirección Comercial</h3>

                            {(plan.estado === 'Borrador' || plan.estado === 'Enviado') && user?.is_admin ? (
                                <div className="review-form">
                                    <label className="review-label">Observaciones de Supervisor</label>
                                    <textarea
                                        className="review-textarea"
                                        placeholder="Escribe aquí tus indicaciones o el motivo del rechazo..."
                                        value={observations}
                                        onChange={(e) => setObservations(e.target.value)}
                                    />
                                    <div className="review-actions">
                                        <button
                                            className="btn-reject"
                                            onClick={() => handleReview('Rechazado')}
                                        >
                                            Rechazar Plan
                                        </button>
                                        <button
                                            className="btn-approve"
                                            onClick={() => handleReview('Aprobado')}
                                        >
                                            Aprobar Plan
                                        </button>
                                    </div>
                                </div>
                            ) : plan.observaciones_supervisor ? (
                                <div className="message-box">
                                    <span className="quote">“</span>
                                    <p>{plan.observaciones_supervisor}</p>
                                </div>
                            ) : null}
                        </PremiumCard>
                    )}

                    {/* Distribución Sidebar */}
                    <PremiumCard className="sidebar-card distribution-card" hover={false}>
                        <h3>Objetivos de Actividad</h3>
                        <div className="dist-bars">
                            <div className="dist-row">
                                <div className="dist-info">
                                    <span>Visitas</span>
                                    <strong>{plan.detalles_agenda?.filter(a => a.tipo_actividad === 'Visita' || a.tipo_actividad === 'Visita asistida').length || 0} / {plan.informe_kpi?.meta_visitas || 0}</strong>
                                </div>
                                <div className="bar-bg">
                                    <div className="bar-fill blue" style={{
                                        width: plan.informe_kpi?.meta_visitas ? `${Math.min((plan.detalles_agenda.filter(a => a.tipo_actividad === 'Visita' || a.tipo_actividad === 'Visita asistida').length / plan.informe_kpi.meta_visitas) * 100, 100)}%` : '0%'
                                    }}></div>
                                </div>
                            </div>
                            <div className="dist-row">
                                <div className="dist-info">
                                    <span>Llamadas</span>
                                    <strong>{plan.detalles_agenda?.filter(a => a.tipo_actividad === 'Llamada').length || 0} / {plan.informe_kpi?.meta_llamadas || 0}</strong>
                                </div>
                                <div className="bar-bg">
                                    <div className="bar-fill purple" style={{
                                        width: plan.informe_kpi?.meta_llamadas ? `${Math.min((plan.detalles_agenda.filter(a => a.tipo_actividad === 'Llamada').length / plan.informe_kpi.meta_llamadas) * 100, 100)}%` : '0%'
                                    }}></div>
                                </div>
                            </div>
                            <div className="dist-row">
                                <div className="dist-info">
                                    <span>Emails</span>
                                    <strong>{plan.detalles_agenda?.filter(a => a.tipo_actividad === 'Correo').length || 0} / {plan.informe_kpi?.meta_emails || 0}</strong>
                                </div>
                                <div className="bar-bg">
                                    <div className="bar-fill orange" style={{
                                        width: plan.informe_kpi?.meta_emails ? `${Math.min((plan.detalles_agenda.filter(a => a.tipo_actividad === 'Correo').length / plan.informe_kpi.meta_emails) * 100, 100)}%` : '0%'
                                    }}></div>
                                </div>
                            </div>
                        </div>
                    </PremiumCard>
                </aside>
            </div>

            <AlertModal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                title={modal.title}
                message={modal.message}
                type={modal.type}
            />

            <style jsx>{`
                .plan-view-container { max-width: 1400px; margin: 0 auto; color: var(--text-body); animation: fadeIn 0.6s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

                .detail-nav { 
                    display: flex; align-items: center; gap: 2rem; margin-bottom: 2.5rem; 
                    background: var(--bg-panel); padding: 1rem 1.5rem; border-radius: 20px;
                    border: 1px solid var(--border-subtle); box-shadow: var(--shadow-sm);
                }
                .back-circle { 
                    width: 48px; height: 48px; border-radius: 50%; border: 1.5px solid var(--border-subtle);
                    background: var(--bg-panel); display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: 0.3s; color: var(--text-muted);
                }
                .back-circle:hover { border-color: var(--primary); color: var(--primary); transform: translateX(-3px); }
                
                .nav-title-wrap { flex: 1; }
                .nav-tag { font-size: 0.65rem; font-weight: 900; color: var(--primary); letter-spacing: 2px; }
                .nav-title { font-size: 1.4rem; font-weight: 800; margin: 2px 0 0; color: var(--text-heading); }

                .nav-actions { display: flex; align-items: center; gap: 1rem; }
                .btn-glass-icon { 
                    width: 48px; height: 48px; border-radius: 14px; background: var(--bg-app);
                    border: 1.5px solid var(--border-subtle); display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: 0.2s; color: var(--text-muted);
                }
                .btn-glass-icon:hover { background: var(--bg-panel); color: var(--primary); transform: translateY(-2px); }

                .btn-action-premium {
                    display: flex; align-items: center; gap: 12px; padding: 0 1.5rem; height: 48px;
                    background: var(--bg-sidebar); color: white; border-radius: 14px; border: none;
                    font-weight: 700; cursor: pointer; transition: 0.3s;
                    box-shadow: var(--shadow-md);
                }
                .btn-action-premium:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }

                .plan-layout { display: grid; grid-template-columns: 1fr 350px; gap: 3rem; }

                .hero-card { margin-bottom: 3.5rem; padding: 0; overflow: hidden; }
                .hero-content { padding: 3rem; background: linear-gradient(135deg, var(--bg-panel) 0%, var(--bg-app) 100%); }
                
                .profile-section { display: flex; align-items: center; gap: 2.5rem; }
                .avatar-gradient { 
                    width: 100px; height: 100px; position: relative; padding: 4px;
                    background: var(--primary-glow); border-radius: 35px;
                }
                .avatar-inner { 
                    width: 100%; height: 100%; background: var(--bg-sidebar); border-radius: 30px;
                    display: flex; align-items: center; justify-content: center;
                }
                .avatar-ring { 
                    position: absolute; inset: -8px; border: 2px solid var(--primary-soft);
                    border-radius: 42px; opacity: 0.3;
                }

                .profile-text h1 { font-size: 2rem; font-weight: 800; color: var(--text-heading); margin: 0; letter-spacing: -0.04em; }
                .role-label { color: var(--text-muted); font-weight: 600; font-size: 1.1rem; margin-top: 5px; }
                .name-badge-wrap { display: flex; align-items: center; gap: 1.5rem; }

                .hero-stats-bar { 
                    display: flex; background: var(--bg-sidebar); padding: 2rem 3rem;
                    color: white; justify-content: space-between;
                }
                .h-stat { display: flex; align-items: center; gap: 1rem; }
                .h-stat svg { color: var(--primary); }
                .h-stat label { display: block; font-size: 0.6rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
                .h-stat span { font-weight: 700; font-size: 1rem; }
                .venta-val { color: #22c55e; font-size: 1.2rem !important; }
                .h-stat-divider { width: 1px; height: 35px; background: rgba(255,255,255,0.1); }

                .section-header { margin-bottom: 3rem; position: relative; }
                .header-decoration { width: 40px; height: 4px; background: var(--primary); border-radius: 2px; margin-bottom: 1rem; }
                .section-header h2 { font-size: 1.6rem; font-weight: 800; margin: 0; color: var(--text-heading); }
                .section-header p { color: var(--text-muted); font-weight: 600; margin-top: 5px; }

                .timeline-wrapper { position: relative; padding-left: 2rem; }
                .timeline-block { display: flex; gap: 3rem; margin-bottom: 3rem; position: relative; }
                .timeline-marker { 
                    position: absolute; left: -2rem; top: 0; bottom: -3rem; width: 40px;
                    display: flex; flex-direction: column; align-items: center;
                }
                .marker-circle { 
                    width: 24px; height: 24px; border: 4px solid var(--bg-app); background: var(--primary);
                    border-radius: 50%; box-shadow: 0 0 0 4px var(--bg-panel); z-index: 2;
                }
                .marker-line { flex: 1; width: 2px; background: var(--border-subtle); margin: -5px 0; }
                
                .day-info { display: flex; align-items: baseline; gap: 1rem; margin-bottom: 1.5rem; }
                .day-info h3 { font-size: 1.3rem; font-weight: 800; margin: 0; text-transform: capitalize; color: var(--text-heading); }
                .act-count { background: var(--bg-app); padding: 4px 12px; border-radius: 10px; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); }

                .activities-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
                .act-detail-card { 
                    background: var(--bg-panel); border: 1.5px solid var(--border-subtle); border-radius: 24px;
                    padding: 1.5rem; display: flex; align-items: center; gap: 1.5rem;
                    transition: 0.3s;
                }
                .act-detail-card:hover { transform: translateX(8px); border-color: var(--primary); box-shadow: var(--shadow-sm); }

                .act-icon-box { 
                    width: 54px; height: 54px; border-radius: 18px; display: flex; align-items: center; 
                    justify-content: center; flex-shrink: 0;
                }
                .act-icon-box[data-type="Visita"], .act-icon-box[data-type="Visita asistida"] { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                .act-icon-box[data-type="Llamada"] { background: var(--primary-glow); color: var(--primary); }
                .act-icon-box[data-type="Correo"], .act-icon-box[data-type="Email"] { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

                .act-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
                .act-type-label { font-size: 0.65rem; font-weight: 900; color: var(--text-muted); letter-spacing: 1px; }
                .act-time-pill { font-size: 0.7rem; font-weight: 800; color: #22c55e; }
                .act-client-name { font-size: 1.1rem; font-weight: 800; margin: 0; color: var(--text-heading); }
                .act-comment { margin: 6px 0 0; font-size: 0.9rem; color: var(--text-body); font-weight: 500; }

                .btn-act-more { 
                    width: 44px; height: 44px; border-radius: 50%; border: none;
                    background: var(--bg-app); color: var(--text-muted); cursor: pointer; transition: 0.2s;
                }
                .btn-act-more:hover { background: var(--primary); color: white; transform: rotate(-45deg); }

                .plan-sidebar { display: flex; flex-direction: column; gap: 2rem; }
                .sidebar-card { padding: 2rem; border-radius: 28px; }
                
                .goals-card-premium { background: var(--bg-sidebar); color: white; border: none; }
                .card-top { display: flex; align-items: center; gap: 12px; margin-bottom: 2rem; }
                .card-top h3 { font-size: 1.1rem; font-weight: 800; margin: 0; }
                .icon-gold { color: #f59e0b; }

                .goal-visual { display: flex; flex-direction: column; gap: 2rem; margin-bottom: 1.5rem; }
                .goal-amount label { display: block; font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
                .goal-amount .currency { font-size: 1.4rem; font-weight: 600; color: var(--primary); margin-right: 5px; }
                .goal-amount .amount { font-size: 2.2rem; font-weight: 900; letter-spacing: -2px; }

                .progress-container { display: flex; flex-direction: column; gap: 10px; }
                .progress-stats { display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600; color: #64748b; }
                .progress-track { height: 10px; background: rgba(255,255,255,0.05); border-radius: 20px; position: relative; }
                .progress-bar-glow { position: absolute; left: 0; top: 0; height: 100%; width: 5%; background: var(--primary); border-radius: 20px; box-shadow: 0 0 15px var(--primary); }

                .directive-card { background: rgba(254, 243, 199, 0.3); border-color: #fef3c7; }
                .directive-card h3 { font-size: 1rem; color: #92400e; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1.5rem; }
                .message-box { position: relative; }
                .quote { font-size: 4rem; position: absolute; top: -30px; left: -15px; opacity: 0.1; color: #b45309; font-family: serif; }
                .message-box p { font-size: 0.95rem; line-height: 1.6; color: #92400e; font-weight: 600; position: relative; font-style: italic; z-index: 1; }
                .author { display: flex; align-items: center; gap: 8px; margin-top: 1.5rem; }
                .author-dot { width: 8px; height: 8px; background: #f59e0b; border-radius: 50%; }
                .author span { font-size: 0.75rem; font-weight: 800; color: #b45309; text-transform: uppercase; }

                .distribution-card h3 { font-size: 1rem; font-weight: 800; margin-bottom: 2rem; color: var(--text-heading); }
                
                .review-form { display: flex; flex-direction: column; gap: 12px; margin-top: 10px; }
                .review-label { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
                .review-textarea { 
                    width: 100%; min-height: 120px; padding: 12px; border-radius: 12px;
                    border: 1px solid var(--border-subtle); background: white; font-size: 0.9rem;
                    font-family: inherit; resize: vertical; outline: none; transition: 0.2s;
                }
                .review-textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-soft); }
                .review-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                .btn-approve { 
                    padding: 10px; border-radius: 10px; border: none; background: #22c55e;
                    color: white; font-weight: 800; cursor: pointer; transition: 0.2s;
                }
                .btn-approve:hover { filter: brightness(1.1); transform: translateY(-2px); }
                .btn-reject { 
                    padding: 10px; border-radius: 10px; border: 1.5px solid #ef4444; background: transparent;
                    color: #ef4444; font-weight: 800; cursor: pointer; transition: 0.2s;
                }
                .btn-reject:hover { background: #fff1f2; transform: translateY(-2px); }

                :global(.dark) .review-textarea { background: var(--bg-app); border-color: var(--border-light); color: white; }

                .dist-bars { display: flex; flex-direction: column; gap: 1.5rem; }
                .dist-info { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
                .dist-info span { font-size: 0.9rem; font-weight: 600; color: var(--text-muted); }
                .dist-info strong { font-size: 1.1rem; font-weight: 800; color: var(--text-heading); }
                .bar-bg { height: 8px; background: var(--bg-app); border-radius: 10px; overflow: hidden; }
                .bar-fill { height: 100%; border-radius: 10px; transition: 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
                .bar-fill.blue { background: var(--primary); }
                .bar-fill.purple { background: #8b5cf6; }
                .bar-fill.orange { background: #f59e0b; }

                @media (max-width: 1200px) {
                    .plan-layout { grid-template-columns: 1fr; }
                    .plan-sidebar { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                }
                @media (max-width: 768px) {
                    .detail-nav { flex-direction: column; align-items: flex-start; gap: 1rem; }
                    .nav-actions { width: 100%; }
                    .btn-action-premium { flex: 1; }
                    .hero-content { padding: 2rem; }
                    .profile-section { flex-direction: column; text-align: center; gap: 1.5rem; }
                    .hero-stats-bar { flex-direction: column; gap: 1.5rem; }
                    .h-stat-divider { width: 100%; height: 1px; }
                    .plan-sidebar { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
};

export default PlanDetail;
