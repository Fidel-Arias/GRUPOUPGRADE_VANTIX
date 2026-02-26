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
    CheckCircle2,
    LayoutDashboard,
    Send
} from 'lucide-react';
import {
    clienteService,
    visitaService,
    empleadoService,
    crmService,
    kpiService,
    authService
} from '../../services/api';
import PageHeader from '../Common/PageHeader';
import PremiumCard from '../Common/PremiumCard';
import Badge from '../Common/Badge';

const MainDashboard = () => {
    const [user, setUser] = useState(null);
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
        const currentUser = authService.getUser();
        setUser(currentUser);

        const fetchDashboardData = async () => {
            if (!currentUser) return;

            try {
                setLoading(true);
                const empId = currentUser.is_admin ? null : currentUser.id_empleado;

                // 1. Fetches concurrentes (Manejando errores individuales para no romper el dashboard)
                const fetchResults = await Promise.allSettled([
                    clienteService.getAll(0, 500, empId),
                    visitaService.getAll({ limit: 500, id_empleado: empId }),
                    currentUser.is_admin ? empleadoService.getAll(0, 100) : Promise.resolve([]),
                    crmService.getLlamadas(null, 0, 50, empId),
                    crmService.getEmails(null, 0, 50, empId),
                    kpiService.getInformes(0, 50, empId)
                ]);

                // Descomponer resultados con fallback
                const clientes = fetchResults[0].status === 'fulfilled' ? fetchResults[0].value : [];
                const visitas = fetchResults[1].status === 'fulfilled' ? fetchResults[1].value : [];
                const empleados = fetchResults[2].status === 'fulfilled' ? fetchResults[2].value : [];
                const llamadas = fetchResults[3].status === 'fulfilled' ? fetchResults[3].value : [];
                const emails = fetchResults[4].status === 'fulfilled' ? fetchResults[4].value : [];
                const kpiReports = fetchResults[5].status === 'fulfilled' ? fetchResults[5].value : [];

                // 2. Calcular Estadísticas
                const totalC = clientes.length || 0;
                const totalV = visitas.length || 0;
                const totalL = llamadas.length || 0;
                const totalE = emails.length || 0;

                // Rendimiento (Lógica segura)
                const rend = kpiReports.length > 0
                    ? (kpiReports.reduce((acc, curr) => acc + (curr.puntos_alcanzados || 0), 0) / kpiReports.length).toFixed(1)
                    : 0;

                setStats({
                    totalClientes: totalC,
                    totalVisitas: totalV,
                    rendimientoMensual: rend,
                    metaProgreso: rend > 100 ? 100 : rend || 0,
                    actividadesMes: totalV + totalL + totalE
                });

                // 3. Procesar Feed de Actividad
                const activityFeed = [
                    ...visitas.map(v => ({
                        type: 'visita',
                        user: (empleados || []).find(e => e.id_empleado === v.id_empleado)?.nombre_completo ||
                            (v.id_empleado === currentUser.id_empleado ? currentUser.nombre_completo : 'Agente'),
                        initials: (v.id_empleado === currentUser.id_empleado ? currentUser.nombre_completo : 'A').charAt(0),
                        action: 'registró visita',
                        target: v.institucion_visitada || 'Cliente',
                        time: v.fecha_hora_checkin || v.fecha_visita || new Date(),
                        icon: <MapPin size={16} />
                    })),
                    ...llamadas.map(l => ({
                        type: 'llamada',
                        user: (empleados || []).find(e => e.id_empleado === l.id_empleado)?.nombre_completo ||
                            (l.id_empleado === currentUser.id_empleado ? currentUser.nombre_completo : 'Agente'),
                        initials: (l.id_empleado === currentUser.id_empleado ? currentUser.nombre_completo : 'A').charAt(0),
                        action: 'realizó llamada',
                        target: l.nombre_destinatario || l.contacto_nombre || 'Contacto',
                        time: l.fecha_hora || l.fecha_llamada || new Date(),
                        icon: <Activity size={16} />
                    })),
                    ...emails.map(e => ({
                        type: 'email',
                        user: (empleados || []).find(em => em.id_empleado === e.id_empleado)?.nombre_completo ||
                            (e.id_empleado === currentUser.id_empleado ? currentUser.nombre_completo : 'Agente'),
                        initials: (e.id_empleado === currentUser.id_empleado ? currentUser.nombre_completo : 'A').charAt(0),
                        action: 'envió correo',
                        target: e.email_destino || 'Destinatario',
                        time: e.fecha_hora || e.fecha_email || new Date(),
                        icon: <Send size={16} />
                    }))
                ].sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0)).slice(0, 10);

                setActividades(activityFeed);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div
            className="dashboard-container"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <PageHeader
                title="Centro de Mando"
                description="Resumen operativo y métricas de desempeño comercial."
                icon={LayoutDashboard}
                breadcrumb={['Vantix', 'Dashboard']}
                actions={
                    <div className="dashboard-actions">
                        <button className="btn-secondary">
                            <Calendar size={18} />
                            <span>Hoy: {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                        </button>
                        <button
                            className="btn-primary"
                            onClick={() => window.location.href = user?.is_admin ? '/kpi' : '/cartera'}
                        >
                            {user?.is_admin ? <TrendingUp size={18} /> : <Briefcase size={18} />}
                            <span>{user?.is_admin ? 'Ver Reporte KPI' : 'Ver Mi Cartera'}</span>
                        </button>
                    </div>
                }
            />

            <div className="stats-grid">
                <StatCard
                    title="Cartera Total"
                    value={stats.totalClientes}
                    subtitle="Puntos de contacto"
                    icon={<Users size={24} />}
                    color="#0ea5e9"
                    delay={0}
                />
                <StatCard
                    title="Visitas Realizadas"
                    value={stats.totalVisitas}
                    subtitle="En el periodo"
                    icon={<MapPin size={24} />}
                    color="#6366f1"
                    delay={0.1}
                />
                <StatCard
                    title="Eficiencia Promedio"
                    value={`${stats.rendimientoMensual}%`}
                    subtitle="Cumplimiento meta"
                    icon={<Activity size={24} />}
                    color="#10b981"
                    delay={0.2}
                />
                <StatCard
                    title="Total Actividades"
                    value={stats.actividadesMes}
                    subtitle="Interacciones CRM"
                    icon={<Activity size={24} />}
                    color="#f59e0b"
                    delay={0.3}
                />
            </div>

            <div className="main-grid">
                <div className="charts-column">
                    <PremiumCard className="bento-card progress-card" hover={false}>
                        <div className="card-header">
                            <div className="header-text">
                                <h3>Cumplimiento Semanal</h3>
                                <p>Progreso hacia el objetivo de ventas</p>
                            </div>
                            <Target className="icon-muted" size={24} />
                        </div>
                        <div className="progress-content">
                            <div className="circle-progress">
                                <svg viewBox="0 0 36 36" className="circular-chart primary">
                                    <path className="circle-bg"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <path className="circle"
                                        strokeDasharray={`${stats.metaProgreso}, 100`}
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <text x="18" y="20.35" className="percentage">{stats.metaProgreso}%</text>
                                </svg>
                            </div>
                            <div className="progress-stats">
                                <div className="stat-row">
                                    <span className="label">Meta Total</span>
                                    <span className="value">S/ 45,000</span>
                                </div>
                                <div className="stat-row">
                                    <span className="label">Alcanzado</span>
                                    <span className="value primary">S/ 34,250</span>
                                </div>
                                <div className="stat-progress-bar">
                                    <div className="bar-fill" style={{ width: `${stats.metaProgreso}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </PremiumCard>

                    <PremiumCard className="bento-card kpi-overview">
                        <div className="card-header">
                            <h3>Métricas Críticas</h3>
                            <CheckCircle2 color="var(--primary)" size={20} />
                        </div>
                        <div className="kpi-list">
                            <MetricItem label="Retención Clientes" value="94%" trend="+2.4%" />
                            <MetricItem label="Tiempo Respuesta" value="1.2h" trend="-15%" positive={false} />
                            <MetricItem label="Cierre Ventas" value="28%" trend="+5.1%" />
                        </div>
                    </PremiumCard>
                </div>

                <div className="feed-column">
                    <PremiumCard className="activity-feed-card" hover={false}>
                        <div className="feed-header">
                            <div className="title">
                                <h3>Actividad Reciente</h3>
                                <div className="pulse"></div>
                            </div>
                            <button className="view-all" onClick={() => window.location.href = '/crm'}>
                                Auditoría Completa <ArrowRight size={14} />
                            </button>
                        </div>
                        <div className="feed-content">
                            {loading ? (
                                <div className="feed-loading">
                                    <div className="skeleton-line"></div>
                                    <div className="skeleton-line"></div>
                                    <div className="skeleton-line"></div>
                                </div>
                            ) : actividades.map((act, i) => (
                                <div key={i} className="feed-item">
                                    <div className="item-left">
                                        <div className="user-avatar">{act.initials}</div>
                                        <div className="item-text">
                                            <p><strong>{act.user}</strong> {act.action} en <span>{act.target}</span></p>
                                            <span className="time">{new Date(act.time).toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                    <div className="item-icon">{act.icon}</div>
                                </div>
                            ))}
                        </div>
                    </PremiumCard>
                </div>
            </div>

            <style jsx>{`
                .dashboard-container { display: flex; flex-direction: column; gap: 2.5rem; }
                
                .dashboard-actions { display: flex; gap: 12px; }
                .btn-primary {
                    background: var(--bg-sidebar); color: white; border: none; padding: 0.8rem 1.5rem;
                    border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 10px;
                    cursor: pointer; transition: all 0.3s; box-shadow: var(--shadow-md);
                }
                .btn-secondary {
                    background: white; color: var(--text-body); border: 1px solid var(--border-subtle);
                    padding: 0.8rem 1.5rem; border-radius: 12px; font-weight: 700; display: flex;
                    align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s;
                }
                :global(.dark) .btn-secondary { background: var(--bg-panel); border-color: var(--border-light); color: white; }

                .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }

                .main-grid { display: grid; grid-template-columns: 1fr 400px; gap: 1.5rem; }
                .charts-column { display: flex; flex-direction: column; gap: 1.5rem; }

                .bento-card { padding: 1.5rem; }
                .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
                .card-header h3 { font-size: 1.1rem; font-weight: 800; color: var(--text-heading); margin: 0; }
                .card-header p { font-size: 0.85rem; color: var(--text-muted); margin: 4px 0 0 0; }

                .progress-content { display: flex; align-items: center; gap: 3rem; }
                .circular-chart { width: 140px; height: 140px; }
                .circle-bg { fill: none; stroke: var(--bg-app); stroke-width: 3; }
                .circle { fill: none; stroke-width: 3; stroke-linecap: round; stroke: var(--primary); transition: stroke-dasharray 0.3s ease; }
                .percentage { fill: var(--text-heading); font-family: 'Outfit'; font-size: 0.5rem; text-anchor: middle; font-weight: 800; }

                .progress-stats { flex: 1; display: flex; flex-direction: column; gap: 12px; }
                .stat-row { display: flex; justify-content: space-between; font-weight: 700; font-size: 0.9rem; }
                .stat-row .primary { color: var(--primary); }
                .stat-progress-bar { height: 8px; background: var(--bg-app); border-radius: 10px; }
                .bar-fill { height: 100%; background: var(--primary); border-radius: 10px; }

                .kpi-list { display: flex; flex-direction: column; gap: 1.5rem; }

                .activity-feed-card { padding: 0 !important; overflow: hidden; height: 100%; display: flex; flex-direction: column; }
                .feed-header { padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-light); }
                .feed-header .title { display: flex; align-items: center; gap: 12px; }
                .feed-header h3 { font-size: 1.1rem; font-weight: 800; color: var(--text-heading); margin: 0; }
                .pulse { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2); animation: pulse 2s infinite; }
                
                .view-all { font-size: 0.75rem; font-weight: 800; color: var(--primary); background: transparent; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; }

                .feed-content { padding: 0.5rem 1.5rem; flex: 1; overflow-y: auto; }
                .feed-item { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 0; border-bottom: 1px solid var(--border-light); }
                .feed-item:last-child { border: none; }
                .item-left { display: flex; align-items: center; gap: 12px; }
                .user-avatar { width: 36px; height: 36px; border-radius: 10px; background: var(--bg-app); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; border: 1px solid var(--border-subtle); }
                .item-text p { font-size: 0.85rem; margin: 0; color: var(--text-muted); }
                .item-text strong { color: var(--text-heading); }
                .item-text span { color: var(--primary); font-weight: 700; }
                .item-text .time { font-size: 0.7rem; color: var(--text-muted); font-weight: 600; }
                .item-icon { color: var(--text-muted); opacity: 0.5; }

                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                }

                @media (max-width: 1200px) {
                    .stats-grid { grid-template-columns: repeat(2, 1fr); }
                    .main-grid { grid-template-columns: 1fr; }
                }
                @media (max-width: 768px) {
                    .stats-grid { grid-template-columns: 1fr; }
                    .progress-content { flex-direction: column; text-align: center; gap: 1.5rem; }
                }
            `}</style>
        </motion.div>
    );
};

const StatCard = ({ title, value, subtitle, icon, color, delay }) => (
    <motion.div
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
        transition={{ delay }}
    >
        <PremiumCard className="stat-card" hover={true}>
            <div className="stat-icon" style={{ backgroundColor: `${color}15`, color: color }}>
                {icon}
            </div>
            <div className="stat-content">
                <span className="stat-label">{title}</span>
                <span className="stat-value">{value}</span>
                <span className="stat-sub">{subtitle}</span>
            </div>
            <style jsx>{`
                :global(.stat-card) { padding: 1.5rem !important; display: flex; align-items: center; gap: 1.25rem; }
                .stat-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
                .stat-content { display: flex; flex-direction: column; }
                .stat-label { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
                .stat-value { font-size: 1.8rem; font-weight: 800; color: var(--text-heading); line-height: 1.2; }
                .stat-sub { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }
            `}</style>
        </PremiumCard>
    </motion.div>
);

const MetricItem = ({ label, value, trend, positive = true }) => (
    <div className="metric-item">
        <span className="label">{label}</span>
        <div className="value-group">
            <span className="value">{value}</span>
            <span className={`trend ${positive ? 'up' : 'down'}`}>{trend}</span>
        </div>
        <style jsx>{`
            .metric-item { display: flex; justify-content: space-between; align-items: center; }
            .label { font-size: 0.9rem; font-weight: 700; color: var(--text-body); }
            .value-group { display: flex; align-items: center; gap: 10px; }
            .value { font-weight: 800; color: var(--text-heading); }
            .trend { font-size: 0.75rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; }
            .trend.up { background: #ecfdf5; color: #10b981; }
            .trend.down { background: #fef2f2; color: #ef4444; }
        `}</style>
    </div>
);

export default MainDashboard;
