import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    User,
    FileText,
    ChevronLeft,
    Clock,
    MapPin,
    Phone,
    Mail,
    CheckCircle2,
    AlertCircle,
    Download,
    Building2,
    Target,
    Trophy,
    TrendingUp,
    Briefcase,
    ArrowRight,
    Send,
    Plus
} from 'lucide-react';
import { planService, empleadoService } from '../../services/api';

const PlanDetail = ({ planId = null }) => {
    const [plan, setPlan] = useState(null);
    const [empleado, setEmpleado] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("PlanDetail mounted. planId prop:", planId);
        let activeId = planId;
        if (!activeId && typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            activeId = params.get('id');
            console.log("ID from URL:", activeId);
        }

        if (activeId) {
            fetchPlanData(activeId);
        } else {
            console.warn("No ID found, terminating loading.");
            setLoading(false);
        }
    }, [planId]);

    const fetchPlanData = async (id) => {
        try {
            console.log("Fetching plan data for ID:", id);
            setLoading(true);
            const data = await planService.getById(id);
            console.log("Plan data received:", data);
            setPlan(data);

            if (data?.id_empleado) {
                console.log("Fetching employee data...");
                const empData = await empleadoService.getAll();
                const found = empData.find(e => e.id_empleado === data.id_empleado);
                console.log("Employee found:", found);
                setEmpleado(found);
            }
        } catch (error) {
            console.error('Error fetching plan in PlanDetail:', error);
        } finally {
            setLoading(false);
            console.log("Fetch cycle completed.");
        }
    };

    if (loading) {
        return (
            <div className="loading-page">
                <div className="spinner-orbit">
                    <div className="orbit-dot"></div>
                </div>
                <p>Sincronizando plan estratégico...</p>
                <style jsx>{`
                    .loading-page { height: 70vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2rem; }
                    .spinner-orbit { width: 60px; height: 60px; border: 3px solid rgba(14, 165, 233, 0.1); border-radius: 50%; position: relative; animation: spin 2s linear infinite; }
                    .orbit-dot { position: absolute; top: -5px; left: 50%; transform: translateX(-50%); width: 10px; height: 10px; background: #0ea5e9; border-radius: 50%; box-shadow: 0 0 15px #0ea5e9; }
                    @keyframes spin { to { transform: rotate(360deg); } }
                    p { font-weight: 700; color: #64748b; font-size: 0.9rem; letter-spacing: 0.5px; text-transform: uppercase; }
                `}</style>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="error-container">
                <div className="error-card glass-morphism">
                    <AlertCircle size={60} color="#ef4444" />
                    <h2>Plan no encontrado</h2>
                    <p>Parece que este registro ya no está disponible o el enlace es incorrecto.</p>
                    <a href="/planes" className="btn-error-back">Regresar al Listado</a>
                </div>
                <style jsx>{`
                    .error-container { height: 70vh; display: flex; align-items: center; justify-content: center; padding: 2rem; }
                    .error-card { padding: 4rem; text-align: center; border-radius: 32px; max-width: 500px; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
                    h2 { font-weight: 800; color: #1e293b; margin: 0; }
                    p { color: #64748b; font-weight: 500; font-size: 1.1rem; }
                    .btn-error-back { padding: 1rem 2rem; background: #0f172a; color: white; border-radius: 16px; font-weight: 700; text-decoration: none; transition: 0.3s; }
                    .btn-error-back:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
                `}</style>
            </div>
        );
    }

    const activitiesByDate = plan.detalles_agenda?.reduce((acc, act) => {
        const date = new Date(act.fecha_actividad).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        if (!acc[date]) acc[date] = [];
        acc[date].push(act);
        return acc;
    }, {}) || {};

    const getStatusStyle = (status) => {
        switch (status) {
            case 'APROBADO': return { gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', bg: '#ecfdf5', color: '#059669', icon: <CheckCircle2 size={16} /> };
            case 'BORRADOR': return { gradient: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)', bg: '#f1f5f9', color: '#64748b', icon: <Clock size={16} /> };
            case 'CERRADO': return { gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', bg: '#eff6ff', color: '#2563eb', icon: <FileText size={16} /> };
            case 'RECHAZADO': return { gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', bg: '#fef2f2', color: '#dc2626', icon: <AlertCircle size={16} /> };
            default: return { gradient: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)', bg: '#f1f5f9', color: '#4b5563', icon: <Clock size={16} /> };
        }
    };

    const statusStyle = getStatusStyle(plan.estado);
    const hasActivities = Object.keys(activitiesByDate).length > 0;

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
                    {plan.estado === 'BORRADOR' && (
                        <button className="btn-action-premium">
                            <Send size={18} />
                            <span>Enviar a revisión</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="plan-layout">
                <main className="plan-main">
                    {/* Header Card Premium */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="hero-card"
                    >
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
                                        <div className="status-pill-premium" style={{ borderColor: statusStyle.color, color: statusStyle.color }}>
                                            <div className="pulse-dot" style={{ backgroundColor: statusStyle.color }}></div>
                                            {statusStyle.icon}
                                            <span>{plan.estado}</span>
                                        </div>
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
                                <TrendingUp size={20} />
                                <div>
                                    <label>Proyección de Venta</label>
                                    <span className="venta-val">$ {plan.ventas_esperadas?.toLocaleString() || '0.00'}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Timeline de Actividades */}
                    <div className="content-section">
                        <div className="section-header">
                            <div className="header-decoration"></div>
                            <h2>Cronograma Detallado</h2>
                            <p>Desglose diario de la hoja de ruta estratégica</p>
                        </div>

                        <div className="timeline-wrapper">
                            {hasActivities ? (
                                Object.entries(activitiesByDate).map(([date, acts], dayIdx) => (
                                    <motion.div
                                        key={date}
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
                                                <h3>{date}</h3>
                                                <span className="act-count">{acts.length} actividades</span>
                                            </div>
                                            <div className="activities-grid">
                                                {acts.map((act, actIdx) => (
                                                    <div key={actIdx} className="act-detail-card">
                                                        <div className="act-icon-box" data-type={act.tipo_actividad}>
                                                            {act.tipo_actividad === 'VISITA' && <MapPin size={20} />}
                                                            {act.tipo_actividad === 'LLAMADA' && <Phone size={20} />}
                                                            {act.tipo_actividad === 'EMAIL' && <Mail size={20} />}
                                                        </div>
                                                        <div className="act-body">
                                                            <div className="act-header">
                                                                <span className="act-type-label">{act.tipo_actividad}</span>
                                                                <span className="act-time-pill"><Clock size={12} /> Próxima</span>
                                                            </div>
                                                            <h4 className="act-client-name">{act.nombre_cliente}</h4>
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
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="empty-roadmap"
                                >
                                    <div className="empty-illustration">
                                        <div className="circle-bg"></div>
                                        <Briefcase size={48} />
                                    </div>
                                    <h3>Sin actividades programadas</h3>
                                    <p>Este plan de trabajo no contiene actividades para el periodo seleccionado. No es posible editar la agenda desde esta vista informativa.</p>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </main>

                <aside className="plan-sidebar">
                    {/* Card de Metas */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="sidebar-card goals-card-premium"
                    >
                        <div className="card-top">
                            <Trophy size={24} className="icon-gold" />
                            <h3>Meta Comercial</h3>
                        </div>
                        <div className="goal-visual">
                            <div className="goal-amount">
                                <label>Venta Objetivo</label>
                                <span className="currency">$</span>
                                <span className="amount">{plan.ventas_esperadas?.toLocaleString() || '0'}</span>
                            </div>
                            <div className="progress-container">
                                <div className="progress-stats">
                                    <span>Progreso actual</span>
                                    <span>0%</span>
                                </div>
                                <div className="progress-track">
                                    <div className="progress-bar-glow"></div>
                                </div>
                            </div>
                        </div>
                        <div className="recommendation-pill">
                            <AlertCircle size={16} />
                            <span>Priorizar prospectos del sector minería.</span>
                        </div>
                    </motion.div>

                    {/* Card de Indicaciones */}
                    <div className="sidebar-card directive-card">
                        <h3>Dirección Comercial</h3>
                        <div className="message-box">
                            <span className="quote">“</span>
                            <p>Mantener el enfoque en la calidad de las visitas más que en la cantidad. Buscamos cierres de alta fidelidad para cerrar el trimestre con fuerza.</p>
                            <div className="author">
                                <div className="author-dot"></div>
                                <span>Sales Director</span>
                            </div>
                        </div>
                    </div>

                    {/* Distribución Sidebar */}
                    <div className="sidebar-card distribution-card">
                        <h3>Eficiencia del Plan</h3>
                        <div className="dist-bars">
                            <div className="dist-row">
                                <div className="dist-info">
                                    <span>Visitas Campo</span>
                                    <strong>{plan.detalles_agenda?.filter(a => a.tipo_actividad === 'VISITA').length || 0}</strong>
                                </div>
                                <div className="bar-bg"><div className="bar-fill blue" style={{ width: plan.detalles_agenda?.length ? `${(plan.detalles_agenda.filter(a => a.tipo_actividad === 'VISITA').length / plan.detalles_agenda.length) * 100}%` : '0%' }}></div></div>
                            </div>
                            <div className="dist-row">
                                <div className="dist-info">
                                    <span>Gestión Digital</span>
                                    <strong>{plan.detalles_agenda?.filter(a => a.tipo_actividad !== 'VISITA').length || 0}</strong>
                                </div>
                                <div className="bar-bg"><div className="bar-fill purple" style={{ width: plan.detalles_agenda?.length ? `${(plan.detalles_agenda.filter(a => a.tipo_actividad !== 'VISITA').length / plan.detalles_agenda.length) * 100}%` : '0%' }}></div></div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            <style jsx>{`
                .plan-view-container { 
                    max-width: 1400px; margin: 0 auto; color: #1e293b; 
                    animation: fadeIn 0.6s ease-out;
                }

                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

                /* Nav Styles */
                .detail-nav { 
                    display: flex; align-items: center; gap: 2rem; margin-bottom: 2.5rem; 
                    background: white; padding: 1rem 1.5rem; border-radius: 20px;
                    border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
                }
                .back-circle { 
                    width: 48px; height: 48px; border-radius: 50%; border: 1.5px solid #e2e8f0;
                    background: white; display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: 0.3s; color: #64748b;
                }
                .back-circle:hover { border-color: #0ea5e9; color: #0ea5e9; transform: translateX(-3px); }
                
                .nav-title-wrap { flex: 1; }
                .nav-tag { font-size: 0.65rem; font-weight: 900; color: #0ea5e9; letter-spacing: 2px; }
                .nav-title { font-size: 1.4rem; font-weight: 800; margin: 2px 0 0; color: #0f172a; }

                .nav-actions { display: flex; align-items: center; gap: 1rem; }
                .btn-glass-icon { 
                    width: 48px; height: 48px; border-radius: 14px; background: #f8fafc;
                    border: 1.5px solid #f1f5f9; display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: 0.2s; color: #64748b;
                }
                .btn-glass-icon:hover { background: #f1f5f9; color: #0ea5e9; transform: translateY(-2px); }

                .btn-action-premium {
                    display: flex; align-items: center; gap: 12px; padding: 0 1.5rem; height: 48px;
                    background: #0f172a; color: white; border-radius: 14px; border: none;
                    font-weight: 700; cursor: pointer; transition: 0.3s;
                    box-shadow: 0 10px 20px -5px rgba(15, 23, 42, 0.3);
                }
                .btn-action-premium:hover { transform: translateY(-3px); background: #1e293b; box-shadow: 0 15px 25px -5px rgba(15, 23, 42, 0.4); }

                /* Layout */
                .plan-layout { display: grid; grid-template-columns: 1fr 350px; gap: 3rem; }

                /* Hero Card */
                .hero-card { 
                    background: white; border-radius: 32px; overflow: hidden;
                    border: 1px solid #f1f5f9; box-shadow: 0 10px 30px -5px rgba(0,0,0,0.03);
                    margin-bottom: 3.5rem;
                }
                .hero-content { padding: 3rem; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); }
                
                .profile-section { display: flex; align-items: center; gap: 2.5rem; }
                .avatar-gradient { 
                    width: 100px; height: 100px; position: relative; padding: 6px;
                    background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
                    border-radius: 35px;
                }
                .avatar-inner { 
                    width: 100%; height: 100%; background: #0f172a; border-radius: 30px;
                    display: flex; align-items: center; justify-content: center;
                }
                .avatar-ring { 
                    position: absolute; inset: -8px; border: 2px solid #e0f2fe;
                    border-radius: 42px; opacity: 0.5;
                }

                .profile-text h1 { font-size: 2rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.04em; }
                .role-label { color: #64748b; font-weight: 600; font-size: 1.1rem; margin-top: 5px; }
                
                .name-badge-wrap { display: flex; align-items: center; gap: 1.5rem; }
                .status-pill-premium { 
                    display: flex; align-items: center; gap: 8px; padding: 6px 14px;
                    border: 1px solid; border-radius: 100px; font-weight: 800; font-size: 0.7rem;
                    text-transform: uppercase; letter-spacing: 0.5px;
                }
                .pulse-dot { width: 6px; height: 6px; border-radius: 50%; animation: pulse 2s infinite; }
                @keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.5); } 100% { opacity: 1; transform: scale(1); } }

                .hero-stats-bar { 
                    display: flex; background: #0f172a; padding: 2rem 3rem;
                    color: white; justify-content: space-between;
                }
                .h-stat { display: flex; align-items: center; gap: 1rem; }
                .h-stat svg { color: #0ea5e9; }
                .h-stat label { display: block; font-size: 0.6rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
                .h-stat span { font-weight: 700; font-size: 1rem; }
                .venta-val { color: #22c55e; font-size: 1.2rem !important; }
                .h-stat-divider { width: 1px; height: 35px; background: rgba(255,255,255,0.1); }

                /* Timeline */
                .section-header { margin-bottom: 3rem; position: relative; }
                .header-decoration { width: 40px; height: 4px; background: #0ea5e9; border-radius: 2px; margin-bottom: 1rem; }
                .section-header h2 { font-size: 1.6rem; font-weight: 800; margin: 0; }
                .section-header p { color: #64748b; font-weight: 600; margin-top: 5px; }

                .timeline-wrapper { position: relative; padding-left: 2rem; }
                .timeline-block { display: flex; gap: 3rem; margin-bottom: 3rem; position: relative; }
                .timeline-marker { 
                    position: absolute; left: -2rem; top: 0; bottom: -3rem; width: 40px;
                    display: flex; flex-direction: column; align-items: center;
                }
                .marker-circle { 
                    width: 24px; height: 24px; border: 4px solid #f1f5f9; background: #0ea5e9;
                    border-radius: 50%; box-shadow: 0 0 0 4px white; z-index: 2;
                }
                .marker-line { flex: 1; width: 2px; background: #f1f5f9; margin: -5px 0; }
                
                .day-card { flex: 1; }
                .day-info { display: flex; align-items: baseline; gap: 1rem; margin-bottom: 1.5rem; }
                .day-info h3 { font-size: 1.3rem; font-weight: 800; margin: 0; text-transform: capitalize; }
                .act-count { background: #f1f5f9; padding: 4px 12px; border-radius: 10px; font-size: 0.75rem; font-weight: 700; color: #64748b; }

                .activities-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
                .act-detail-card { 
                    background: white; border: 1.5px solid #f1f5f9; border-radius: 24px;
                    padding: 1.5rem; display: flex; align-items: center; gap: 1.5rem;
                    transition: 0.3s;
                }
                .act-detail-card:hover { transform: translateX(8px); border-color: #0ea5e9; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }

                .act-icon-box { 
                    width: 54px; height: 54px; border-radius: 18px; display: flex; align-items: center; 
                    justify-content: center; flex-shrink: 0;
                }
                .act-icon-box[data-type="VISITA"] { background: #fee2e2; color: #ef4444; }
                .act-icon-box[data-type="LLAMADA"] { background: #e0f2fe; color: #0ea5e9; }
                .act-icon-box[data-type="EMAIL"] { background: #fef3c7; color: #f59e0b; }

                .act-body { flex: 1; }
                .act-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
                .act-type-label { font-size: 0.65rem; font-weight: 900; color: #94a3b8; letter-spacing: 1px; }
                .act-time-pill { display: flex; align-items: center; gap: 4px; font-size: 0.7rem; font-weight: 800; color: #22c55e; }
                
                .act-client-name { font-size: 1.1rem; font-weight: 800; margin: 0; color: #0f172a; }
                .act-comment { margin: 6px 0 0; font-size: 0.9rem; color: #64748b; font-weight: 500; }

                .btn-act-more { 
                    width: 44px; height: 44px; border-radius: 50%; border: none;
                    background: #f8fafc; color: #94a3b8; cursor: pointer; transition: 0.2s;
                }
                .btn-act-more:hover { background: #0ea5e9; color: white; transform: rotate(-45deg); }

                /* Empty State */
                .empty-roadmap { 
                    display: flex; flex-direction: column; align-items: center; 
                    justify-content: center; text-align: center; padding: 6rem 2rem;
                    background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 32px;
                }
                .empty-illustration { position: relative; margin-bottom: 2rem; color: #94a3b8; }
                .circle-bg { 
                    position: absolute; inset: -20px; background: white; 
                    border-radius: 50%; box-shadow: 0 10px 30px rgba(0,0,0,0.05); z-index: -1;
                }
                .empty-roadmap h3 { font-size: 1.4rem; font-weight: 800; margin-bottom: 0.5rem; }
                .empty-roadmap p { max-width: 400px; color: #64748b; font-weight: 500; font-size: 1.1rem; line-height: 1.5; margin-bottom: 2rem; }

                .btn-empty-action { 
                    display: flex; align-items: center; gap: 10px; padding: 1rem 2rem;
                    background: #0ea5e9; color: white; border-radius: 16px; border: none;
                    font-weight: 700; cursor: pointer; transition: 0.3s;
                }
                .btn-empty-action:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(14, 165, 233, 0.3); }

                /* Sidebar */
                .plan-sidebar { display: flex; flex-direction: column; gap: 2rem; }
                .sidebar-card { background: white; padding: 2rem; border-radius: 28px; border: 1px solid #f1f5f9; }
                
                .goals-card-premium { background: #0f172a; color: white; border: none; position: relative; overflow: hidden; }
                .card-top { display: flex; align-items: center; gap: 12px; margin-bottom: 2rem; }
                .card-top h3 { font-size: 1.1rem; font-weight: 800; margin: 0; }
                .icon-gold { color: #f59e0b; }

                .goal-visual { display: flex; flex-direction: column; gap: 2rem; margin-bottom: 1.5rem; }
                .goal-amount label { display: block; font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
                .goal-amount .currency { font-size: 1.4rem; font-weight: 600; color: #0ea5e9; margin-right: 5px; }
                .goal-amount .amount { font-size: 2.2rem; font-weight: 900; letter-spacing: -2px; }

                .progress-container { display: flex; flex-direction: column; gap: 10px; }
                .progress-stats { display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600; color: #64748b; }
                .progress-track { height: 10px; background: rgba(255,255,255,0.05); border-radius: 20px; position: relative; }
                .progress-bar-glow { position: absolute; left: 0; top: 0; height: 100%; width: 5%; background: #0ea5e9; border-radius: 20px; box-shadow: 0 0 15px #0ea5e9; }

                .recommendation-pill { background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); padding: 12px; border-radius: 12px; display: flex; gap: 10px; font-size: 0.8rem; color: #f59e0b; font-weight: 600; }

                .directive-card { background: #fffcf0; border-color: #fef3c7; }
                .directive-card h3 { font-size: 1rem; color: #92400e; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1.5rem; }
                .message-box { position: relative; }
                .quote { font-size: 4rem; position: absolute; top: -30px; left: -15px; opacity: 0.1; color: #b45309; font-family: serif; }
                .message-box p { font-size: 0.95rem; line-height: 1.6; color: #92400e; font-weight: 600; position: relative; font-style: italic; z-index: 1; }
                
                .author { display: flex; align-items: center; gap: 8px; margin-top: 1.5rem; }
                .author-dot { width: 8px; height: 8px; background: #f59e0b; border-radius: 50%; }
                .author span { font-size: 0.75rem; font-weight: 800; color: #b45309; text-transform: uppercase; }

                .distribution-card h3 { font-size: 1rem; font-weight: 800; margin-bottom: 2rem; }
                .dist-bars { display: flex; flex-direction: column; gap: 1.5rem; }
                .dist-info { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
                .dist-info span { font-size: 0.9rem; font-weight: 600; color: #64748b; }
                .dist-info strong { font-size: 1.1rem; font-weight: 800; color: #0f172a; }
                .bar-bg { height: 8px; background: #f1f5f9; border-radius: 10px; overflow: hidden; }
                .bar-fill { height: 100%; border-radius: 10px; transition: 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
                .bar-fill.blue { background: #0ea5e9; }
                .bar-fill.purple { background: #8b5cf6; }

                /* Responsiveness */
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
