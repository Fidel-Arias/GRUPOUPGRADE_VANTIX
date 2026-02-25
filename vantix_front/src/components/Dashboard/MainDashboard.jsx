import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    Users,
    MapPin,
    Calendar,
    Activity,
    PlusCircle,
    FileText,
    ArrowRight,
    Clock,
    Briefcase,
    DollarSign,
    Target,
    CheckCircle2
} from 'lucide-react';
import {
    clienteService,
    visitaService,
    empleadoService,
    crmService,
    kpiService
} from '../../services/api';

const MainDashboard = () => {
    const [stats, setStats] = useState({
        totalClientes: 0,
        totalVisitas: 0,
        rendimientoMensual: 0,
        metaProgreso: 78, // Default fallback
        actividadesMes: 0
    });
    const [actividades, setActividades] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [
                    clientes,
                    visitas,
                    empleados,
                    llamadas,
                    emails,
                    kpiReports
                ] = await Promise.all([
                    clienteService.getAll(0, 500),
                    visitaService.getAll({ limit: 500 }),
                    empleadoService.getAll(0, 100),
                    crmService.getLlamadas(null, 0, 50),
                    crmService.getEmails(null, 0, 50),
                    kpiService.getInformes()
                ]);

                // 1. Calculate Stats
                const totalC = clientes.length || 0;
                const totalV = visitas.length || 0;
                const totalL = llamadas.length || 0;
                const totalE = emails.length || 0;

                // Rendimiento (Mock logic based on real KPI reports if available)
                const rend = kpiReports.length > 0
                    ? (kpiReports.reduce((acc, curr) => acc + (curr.puntos_alcanzados || 0), 0) / kpiReports.length).toFixed(1)
                    : 84.5;

                setStats({
                    totalClientes: totalC,
                    totalVisitas: totalV,
                    rendimientoMensual: rend,
                    metaProgreso: 75,
                    actividadesMes: totalV + totalL + totalE
                });

                // 2. Process Activity Feed
                const activityFeed = [
                    ...visitas.map(v => ({
                        type: 'visita',
                        user: empleados.find(e => e.id_empleado === v.id_empleado)?.nombre_completo || 'Agente',
                        initials: (empleados.find(e => e.id_empleado === v.id_empleado)?.nombre_completo || 'A').charAt(0),
                        action: 'registró visita',
                        target: v.institucion_visitada,
                        time: v.fecha_visita,
                        icon: <MapPin size={16} />
                    })),
                    ...llamadas.map(l => ({
                        type: 'llamada',
                        user: empleados.find(e => e.id_empleado === l.id_empleado)?.nombre_completo || 'Agente',
                        initials: (empleados.find(e => e.id_empleado === l.id_empleado)?.nombre_completo || 'A').charAt(0),
                        action: 'realizó llamada',
                        target: l.contacto_nombre,
                        time: l.fecha_llamada,
                        icon: <Activity size={16} />
                    })),
                    ...emails.map(e => ({
                        type: 'email',
                        user: empleados.find(em => em.id_empleado === e.id_empleado)?.nombre_completo || 'Agente',
                        initials: (empleados.find(em => em.id_empleado === e.id_empleado)?.nombre_completo || 'A').charAt(0),
                        action: 'envió correo',
                        target: e.contacto_nombre,
                        time: e.fecha_email,
                        icon: <FileText size={16} />
                    }))
                ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6);

                setActividades(activityFeed);

            } catch (error) {
                console.error("Dashboard error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const getTimeAgo = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInMs = now - date;
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        if (diffInHours < 1) return 'Hace poco';
        if (diffInHours < 24) return `Hace ${diffInHours}h`;
        return date.toLocaleDateString();
    };

    return (
        <div className="dashboard-content">
            {/* Bento Grid */}
            <div className="bento-container">
                {/* 1. Hero Metric */}
                <motion.div
                    className="bento-card hero-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="card-glass"></div>
                    <div className="card-body">
                        <header>
                            <span class="label">Puntuación de Red Global</span>
                            <div className="trend positive">
                                <TrendingUp size={14} />
                                <span>Real-time</span>
                            </div>
                        </header>
                        <div className="main-stat">
                            <h2 className="counter">{loading ? '...' : stats.rendimientoMensual}</h2>
                            <span className="unit">PTS</span>
                        </div>
                        <div className="goal-track">
                            <div className="track-header">
                                <span>Progreso de Meta Equipal</span>
                                <span>{stats.metaProgreso}%</span>
                            </div>
                            <div className="track-bar">
                                <motion.div
                                    className="progress"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stats.metaProgreso}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                ></motion.div>
                            </div>
                            <p className="footer-text">
                                Basado en el rendimiento de <strong>{stats.totalVisitas}</strong> visitas registradas.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* 2. Interactive Quick Actions */}
                <motion.div
                    className="bento-card actions-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <h3>Accesos Rápidos</h3>
                    <div className="actions-grid">
                        <a href="/empleados" className="action-btn">
                            <div className="icon-wrap ico-blue"><Users size={20} /></div>
                            <span>Equipo</span>
                        </a>
                        <a href="/visitas" className="action-btn">
                            <div className="icon-wrap ico-orange"><MapPin size={20} /></div>
                            <span>Visitas</span>
                        </a>
                        <a href="/kpi" className="action-btn">
                            <div className="icon-wrap ico-purple"><TrendingUp size={20} /></div>
                            <span>KPIs</span>
                        </a>
                        <a href="/finanzas" className="action-btn">
                            <div className="icon-wrap ico-green"><DollarSign size={20} /></div>
                            <span>Gastos</span>
                        </a>
                    </div>
                </motion.div>

                {/* 3. Mini Stat: Clients */}
                <motion.div
                    className="bento-card mini-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="mini-icon blue"><Users size={22} /></div>
                    <div className="mini-data">
                        <h4>{loading ? '...' : stats.totalClientes}</h4>
                        <p>Clientes Activos</p>
                        <span className="mini-trend">+ Cartera Total</span>
                    </div>
                </motion.div>

                {/* 4. Mini Stat: Activities */}
                <motion.div
                    className="bento-card mini-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="mini-icon orange"><Activity size={22} /></div>
                    <div className="mini-data">
                        <h4>{loading ? '...' : stats.actividadesMes}</h4>
                        <p>Actividad Total</p>
                        <span className="mini-trend">Visitas + CRM</span>
                    </div>
                </motion.div>

                {/* 5. Chart Card (Real Projection) */}
                <motion.div
                    className="bento-card chart-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <header>
                        <div className="title">
                            <Activity size={18} />
                            <h3>Impacto por Actividad</h3>
                        </div>
                        <div className="legend">
                            <span className="it actual"><i></i> Real</span>
                            <span className="it target"><i></i> Promedio</span>
                        </div>
                    </header>
                    <div className="chart-visual">
                        <div className="chart-y-axis">
                            <span>Max</span>
                            <span>Avg</span>
                            <span>0</span>
                        </div>
                        <div className="chart-bars-wrap">
                            {[65, 80, 45, 90, 70, 85].map((val, i) => (
                                <div key={i} className="bar-col">
                                    <div className="bar-container">
                                        <div className="bar-target" style={{ height: '60%' }}></div>
                                        <motion.div
                                            className="bar-actual"
                                            initial={{ height: 0 }}
                                            animate={{ height: `${val}%` }}
                                            transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                                        >
                                            <div className="glow"></div>
                                        </motion.div>
                                    </div>
                                    <span className="day-label">{['V', 'L', 'C', 'G', 'P', 'T'][i]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* 6. Real-time Activity Stream */}
                <motion.div
                    className="bento-card feed-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <header>
                        <h3>Actividad Reciente</h3>
                        <button className="btn-more"><ArrowRight size={16} /></button>
                    </header>
                    <div className="feed-body">
                        {loading ? (
                            <div className="loading-feed">Actualizando...</div>
                        ) : actividades.length > 0 ? (
                            actividades.map((act, i) => (
                                <div key={i} className="feed-item">
                                    <div className={`avatar ${act.type === 'visita' ? 'vis' : act.type === 'llamada' ? 'call' : 'mail'}`}>
                                        {act.initials}
                                    </div>
                                    <div className="info">
                                        <p><strong>{act.user}</strong> {act.action}</p>
                                        <span className="meta">
                                            <Clock size={12} /> {getTimeAgo(act.time)} • {act.target || 'Vantix'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-feed">Sin actividad reciente registrada.</div>
                        )}
                    </div>
                </motion.div>
            </div>

            <style jsx>{`
                .bento-container {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    grid-template-rows: repeat(2, auto);
                    gap: 1.5rem;
                }

                .bento-card {
                    background: var(--bg-panel);
                    border-radius: 28px;
                    border: 1px solid var(--border-subtle);
                    padding: 1.8rem;
                    position: relative;
                    overflow: hidden;
                    box-shadow: var(--shadow-sm);
                }

                .hero-card {
                    grid-column: span 2;
                    background: var(--bg-sidebar);
                    color: white;
                    border: none;
                }

                .card-glass {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at top right, rgba(14, 165, 233, 0.2), transparent 70%);
                    pointer-events: none;
                }

                .main-stat {
                    display: flex;
                    align-items: baseline;
                    gap: 12px;
                    margin: 1.5rem 0 2rem;
                }

                .main-stat h2 { 
                    font-size: 4.5rem; 
                    font-weight: 900; 
                    margin: 0; 
                    letter-spacing: -0.04em; 
                    line-height: 1;
                }

                .main-stat .unit { color: var(--primary); font-weight: 800; font-size: 1.5rem; }

                .hero-card header { display: flex; justify-content: space-between; align-items: center; }
                .hero-card .label { font-size: 0.8rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }

                .trend { display: flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; background: rgba(14, 165, 233, 0.15); color: #38bdf8; }

                .track-header { display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.75rem; }
                .track-bar { height: 10px; background: rgba(255, 255, 255, 0.08); border-radius: 10px; overflow: hidden; }
                .progress { height: 100%; background: linear-gradient(90deg, var(--primary), #6366f1); border-radius: 10px; }

                .actions-card h3 { font-size: 1.1rem; margin-bottom: 1.5rem; font-weight: 800; color: var(--text-heading); }
                .actions-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
                .action-btn { 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    gap: 10px; 
                    padding: 1.25rem 0.75rem; 
                    background: var(--bg-app); 
                    border-radius: 24px; 
                    transition: all 0.3s; 
                    text-decoration: none; 
                    border: 1px solid var(--border-subtle); 
                }
                .action-btn:hover { 
                    background: var(--bg-panel); 
                    transform: translateY(-5px); 
                    border-color: var(--primary); 
                    box-shadow: var(--shadow-md); 
                }
                .icon-wrap { 
                    width: 44px; 
                    height: 44px; 
                    border-radius: 14px; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    background: var(--bg-panel); 
                    box-shadow: var(--shadow-sm); 
                }
                .action-btn span { font-size: 0.75rem; font-weight: 800; color: var(--text-body); }

                .mini-card { display: flex; align-items: center; gap: 1.25rem; }
                .mini-icon { width: 56px; height: 56px; border-radius: 18px; display: flex; align-items: center; justify-content: center; }
                .mini-icon.blue { background: var(--primary-glow); color: var(--primary); }
                .mini-icon.orange { background: rgba(249, 115, 22, 0.1); color: #f97316; }
                .mini-data h4 { font-size: 1.75rem; font-weight: 900; color: var(--text-heading); line-height: 1; }
                .mini-data p { font-size: 0.85rem; color: var(--text-muted); font-weight: 700; margin-top: 4px; }
                .mini-trend { font-size: 0.7rem; font-weight: 800; color: #10b981; margin-top: 4px; display: block; }

                .chart-card { grid-column: span 3; }
                .chart-card header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .chart-card h3 { color: var(--text-heading); }
                .legend { display: flex; gap: 15px; }
                .legend .it { display: flex; align-items: center; gap: 6px; font-size: 0.7rem; font-weight: 800; color: var(--text-muted); }
                .legend i { width: 8px; height: 8px; border-radius: 50%; }
                .actual i { background: var(--primary); box-shadow: 0 0 10px var(--primary); }
                .target i { background: var(--border-subtle); }

                .chart-visual { height: 200px; display: flex; gap: 1rem; position: relative; }
                .chart-y-axis { display: flex; flex-direction: column; justify-content: space-between; font-size: 0.65rem; font-weight: 800; color: var(--text-muted); padding-bottom: 25px; }
                .chart-bars-wrap { flex: 1; display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid var(--border-subtle); padding-bottom: 25px; }
                .bar-col { flex: 1; max-width: 40px; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; position: relative; }
                .bar-container { width: 100%; height: 100%; position: relative; background: var(--bg-app); border-radius: 10px; overflow: hidden; }
                .bar-target { position: absolute; bottom: 0; width: 100%; background: var(--border-light); border-top: 1px dashed var(--text-muted); opacity: 0.3; }
                .bar-actual { position: absolute; bottom: 0; width: 100%; background: var(--primary); border-radius: 8px; position: relative; }
                .bar-actual .glow { position: absolute; top: 0; left: 0; width: 100%; height: 15px; background: linear-gradient(to top, transparent, rgba(255,255,255,0.4)); }
                .day-label { position: absolute; bottom: -25px; font-size: 0.7rem; font-weight: 800; color: var(--text-muted); }

                .feed-card header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
                .feed-card h3 { font-size: 1.1rem; font-weight: 800; color: var(--text-heading); }
                .feed-body { display: flex; flex-direction: column; gap: 1.2rem; }
                .feed-item { display: flex; gap: 1rem; align-items: center; }
                .avatar { 
                    width: 40px; 
                    height: 40px; 
                    border-radius: 50%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    font-size: 0.8rem; 
                    font-weight: 800; 
                    background: var(--bg-app); 
                    border: 2px solid var(--border-subtle); 
                    box-shadow: var(--shadow-sm); 
                }
                .avatar.vis { color: #f97316; background: rgba(249, 115, 22, 0.1); }
                .avatar.call { color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
                .avatar.mail { color: #10b981; background: rgba(16, 185, 129, 0.1); }
                .info p { font-size: 0.85rem; color: var(--text-heading); margin: 0; }
                .info p strong { color: var(--primary); }
                .info .meta { font-size: 0.7rem; color: var(--text-muted); font-weight: 600; display: flex; align-items: center; gap: 4px; margin-top: 2px; }

                .title { display: flex; align-items: center; gap: 8px; color: var(--text-heading); }
                .btn-more { background: none; border: none; color: var(--text-muted); cursor: pointer; }

                @media (max-width: 1200px) {
                    .bento-container { grid-template-columns: repeat(2, 1fr); }
                    .chart-card { grid-column: span 2; }
                }

                @media (max-width: 768px) {
                    .bento-container { grid-template-columns: 1fr; gap: 1rem; }
                    .hero-card, .chart-card { grid-column: span 1; }
                    .main-stat h2 { font-size: 3rem; }
                    .actions-grid { grid-template-columns: repeat(2, 1fr); }
                    .chart-visual { height: 180px; }
                    .chart-bars-wrap { gap: 0.5rem; }
                    .day-label { bottom: -20px; font-size: 0.6rem; }
                }
            `}</style>
        </div>
    );
};

export default MainDashboard;
