import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy,
    Target,
    TrendingUp,
    Medal,
    Zap,
    BarChart3,
    DollarSign,
    Award,
    Star,
    Crown,
    ChevronRight,
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Users,
    Calendar,
    Briefcase,
    Phone,
    Mail
} from 'lucide-react';
import { kpiService, empleadoService } from '../../services/api';
import PageHeader from '../Common/PageHeader';
import PremiumCard from '../Common/PremiumCard';
import Badge from '../Common/Badge';

const KPIDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState([]);
    const [empleados, setEmpleados] = useState([]);
    const [incentivos, setIncentivos] = useState([]);
    const [filterEmpleado, setFilterEmpleado] = useState('');
    const [selectedView, setSelectedView] = useState('overview'); // 'overview', 'ranking', 'incentives'

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [reportsData, empData, incData] = await Promise.all([
                kpiService.getReports ? kpiService.getReports() : kpiService.getInformes(),
                empleadoService.getAll(),
                kpiService.getIncentivos()
            ]);
            setReports(reportsData);
            setEmpleados(empData);
            setIncentivos(incData);
        } catch (error) {
            console.error('Error fetching KPI data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate Global Ranking (Gamification)
    const ranking = empleados.map(emp => {
        // Mock points for demonstration
        return {
            ...emp,
            totalPoints: Math.floor(Math.random() * 5000) + 1000,
            level: Math.floor(Math.random() * 50) + 1,
            badge: ['Titan', 'Elite', 'Senior', 'Junior'][Math.floor(Math.random() * 4)],
            growth: (Math.random() * 20).toFixed(1)
        };
    }).sort((a, b) => b.totalPoints - a.totalPoints);

    const stats = [
        { label: 'Efectividad Global', value: '84%', icon: <Target size={20} />, color: '#0ea5e9', growth: '+5.2%' },
        { label: 'Puntos de Red', value: '128.5k', icon: <Zap size={20} />, color: '#f59e0b', growth: '+12.8%' },
        { label: 'Bonos Generados', value: 'S/ 4,250', icon: <DollarSign size={20} />, color: '#10b981', growth: '+8.4%' },
        { label: 'Actividades Realizadas', value: '1,420', icon: <Briefcase size={20} />, color: '#6366f1', growth: '+2.1%' },
    ];

    if (loading) {
        return (
            <div className="kpi-loading-wrapper">
                <div className="loader"></div>
                <p>Sincronizando métricas de rendimiento...</p>
            </div>
        );
    }

    return (
        <div className="kpi-container">
            <PageHeader
                title="Rendimiento y Gamificación"
                description="Métricas de éxito, incentivos y ranking de competitividad."
                icon={Trophy}
                breadcrumb={['Métricas', 'KPIs']}
                actions={
                    <div className="view-switcher-elite">
                        <button
                            className={selectedView === 'overview' ? 'active' : ''}
                            onClick={() => setSelectedView('overview')}
                        >
                            <BarChart3 size={18} />
                            <span>Dashboard</span>
                        </button>
                        <button
                            className={selectedView === 'ranking' ? 'active' : ''}
                            onClick={() => setSelectedView('ranking')}
                        >
                            <Trophy size={18} />
                            <span>Ranking</span>
                        </button>
                        <button
                            className={selectedView === 'incentives' ? 'active' : ''}
                            onClick={() => setSelectedView('incentives')}
                        >
                            <Medal size={18} />
                            <span>Premios</span>
                        </button>
                    </div>
                }
            />

            <div className="stats-strip">
                {stats.map((stat, i) => (
                    <PremiumCard key={i} className="mini-stat-card">
                        <div className="icon-box" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                            {stat.icon}
                        </div>
                        <div className="stat-info">
                            <span className="label">{stat.label}</span>
                            <div className="value-row">
                                <span className="value">{stat.value}</span>
                                <span className="growth">{stat.growth}</span>
                            </div>
                        </div>
                    </PremiumCard>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {selectedView === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="view-content"
                    >
                        <div className="overview-grid">
                            <PremiumCard className="main-chart-card" hover={false}>
                                <div className="card-header">
                                    <h3>Tendencia de Productividad</h3>
                                    <div className="chart-actions">
                                        <button className="active">Mensual</button>
                                        <button>Semanal</button>
                                    </div>
                                </div>
                                <div className="mock-chart-container">
                                    {/* Abstract background for "Elite" feel */}
                                    <div className="abstract-line"></div>
                                    <div className="chart-placeholder">
                                        <TrendingUp size={48} className="icon-muted" />
                                        <p>Visualización de tendencia en tiempo real</p>
                                    </div>
                                </div>
                            </PremiumCard>

                            <div className="side-cards">
                                <PremiumCard className="kpi-score-card">
                                    <div className="score-header">
                                        <Zap size={24} color="#f59e0b" />
                                        <span>Puntaje de Red</span>
                                    </div>
                                    <div className="score-value">845.2</div>
                                    <div className="score-progress">
                                        <div className="progress-bar"><div className="fill" style={{ width: '84%' }}></div></div>
                                        <span>84% del objetivo</span>
                                    </div>
                                </PremiumCard>

                                <PremiumCard className="kpi-goals-card">
                                    <h3>Objetivos Pendientes</h3>
                                    <div className="goal-item">
                                        <span>Visitas Corporativas</span>
                                        <span className="goal-val">12/15</span>
                                    </div>
                                    <div className="goal-item">
                                        <span>Nuevos Prospectos</span>
                                        <span className="goal-val">4/10</span>
                                    </div>
                                </PremiumCard>
                            </div>
                        </div>
                    </motion.div>
                )}

                {selectedView === 'ranking' && (
                    <motion.div
                        key="ranking"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="view-content"
                    >
                        <div className="ranking-podium">
                            {ranking.slice(0, 3).map((emp, i) => (
                                <div key={emp.id_empleado} className={`podium-item place-${i + 1}`}>
                                    <div className="avatar-wrapper">
                                        <div className="avatar">{emp.nombre_completo.charAt(0)}</div>
                                        <div className="crown">{i === 0 ? <Crown size={24} /> : i + 1}</div>
                                    </div>
                                    <span className="name">{emp.nombre_completo}</span>
                                    <span className="points">{emp.totalPoints} pts</span>
                                    <Badge variant="info">{emp.badge}</Badge>
                                </div>
                            ))}
                        </div>

                        <PremiumCard className="ranking-table-card">
                            <table className="ranking-table">
                                <thead>
                                    <tr>
                                        <th>PUESTO</th>
                                        <th>ASESOR</th>
                                        <th>NIVEL</th>
                                        <th>PUNTOS</th>
                                        <th>CRECIMIENTO</th>
                                        <th className="text-right">ESTADO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ranking.map((emp, i) => (
                                        <tr key={emp.id_empleado}>
                                            <td><span className="rank-num">#{i + 1}</span></td>
                                            <td>
                                                <div className="user-cell">
                                                    <span className="user-name">{emp.nombre_completo}</span>
                                                    <span className="user-badge">{emp.badge}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="level-box">
                                                    <span className="lvl">LVL {emp.level}</span>
                                                    <div className="lvl-bar"><div className="fill" style={{ width: '60%' }}></div></div>
                                                </div>
                                            </td>
                                            <td><span className="pts">{emp.totalPoints}</span></td>
                                            <td>
                                                <div className="growth-indicator positive">
                                                    <ArrowUpRight size={14} /> {emp.growth}%
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <button className="btn-details">
                                                    <span>Progreso</span>
                                                    <ChevronRight size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </PremiumCard>
                    </motion.div>
                )}

                {selectedView === 'incentives' && (
                    <motion.div
                        key="incentives"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="view-content"
                    >
                        <div className="incentives-grid">
                            {incentivos.map(inc => (
                                <PremiumCard key={inc.id_incentivo} className="incentive-card">
                                    <div className="inc-header">
                                        <div className="inc-icon"><Medal size={24} /></div>
                                        <Badge variant="warning">Recompensa</Badge>
                                    </div>
                                    <div className="inc-body">
                                        <h3>{inc.nombre_incentivo}</h3>
                                        <p>{inc.descripcion}</p>
                                        <div className="req-box">
                                            <Target size={14} />
                                            <span>Requiere {inc.puntos_requeridos} Pts</span>
                                        </div>
                                    </div>
                                    <div className="inc-footer">
                                        <button className="btn-redeem" disabled>Canjear Recompensa</button>
                                    </div>
                                </PremiumCard>
                            ))}
                            {/* Static demo cards if empty */}
                            {incentivos.length === 0 && [1, 2, 3].map(i => (
                                <PremiumCard key={i} className="incentive-card demo">
                                    <div className="inc-header">
                                        <div className="inc-icon"><Star size={24} color="#f59e0b" /></div>
                                        <Badge variant="primary">Demo</Badge>
                                    </div>
                                    <div className="inc-body">
                                        <h3>Bono de Excelencia {i}</h3>
                                        <p>Reconocimiento especial por sobrecumplimiento de metas mensuales.</p>
                                        <div className="req-box">
                                            <Zap size={14} />
                                            <span>2,500 Pts</span>
                                        </div>
                                    </div>
                                    <div className="inc-footer">
                                        <button className="btn-redeem">Ver Requisitos</button>
                                    </div>
                                </PremiumCard>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .kpi-container { display: flex; flex-direction: column; gap: 1.5rem; }

                .view-switcher-elite {
                    display: flex; gap: 8px; padding: 6px; background: white;
                    border: 1px solid var(--border-subtle); border-radius: 12px;
                }
                :global(.dark) .view-switcher-elite { background: var(--bg-panel); border-color: var(--border-light); }
                .view-switcher-elite button {
                    display: flex; align-items: center; gap: 10px; padding: 10px 20px;
                    border: none; background: transparent; color: var(--text-muted);
                    font-weight: 800; font-size: 0.85rem; cursor: pointer; transition: all 0.2s;
                    border-radius: 8px;
                }
                .view-switcher-elite button.active { background: var(--bg-sidebar); color: white; }

                .stats-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
                :global(.mini-stat-card) { padding: 1.25rem !important; display: flex; align-items: center; gap: 15px; }
                .icon-box { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
                .stat-info { display: flex; flex-direction: column; }
                .stat-info .label { font-size: 0.7rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
                .value-row { display: flex; align-items: baseline; gap: 10px; }
                .value-row .value { font-size: 1.25rem; font-weight: 800; color: var(--text-heading); }
                .value-row .growth { font-size: 0.75rem; color: #10b981; font-weight: 700; }

                .overview-grid { display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem; }
                .side-cards { display: flex; flex-direction: column; gap: 1.5rem; }

                .main-chart-card { min-height: 400px; padding: 1.5rem; display: flex; flex-direction: column; }
                .chart-actions { display: flex; gap: 8px; }
                .chart-actions button {
                    padding: 6px 12px; border-radius: 8px; border: 1px solid var(--border-subtle);
                    background: white; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); cursor: pointer;
                }
                .chart-actions button.active { background: var(--primary-glow); border-color: var(--primary); color: var(--primary); }
                .mock-chart-container { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
                .chart-placeholder { text-align: center; color: var(--text-muted); z-index: 1; }
                .chart-placeholder p { font-size: 0.9rem; margin-top: 15px; font-weight: 600; }

                .score-header { display: flex; align-items: center; gap: 10px; font-weight: 800; color: var(--text-heading); margin-bottom: 10px; }
                .score-value { font-size: 2.5rem; font-weight: 900; color: var(--primary); line-height: 1; margin-bottom: 15px; }
                .level-box { display: flex; flex-direction: column; gap: 4px; }
                .lvl-bar { height: 6px; background: var(--bg-app); border-radius: 10px; overflow: hidden; }
                .lvl-bar .fill { height: 100%; background: var(--primary); }

                .podium-item { 
                    display: flex; flex-direction: column; align-items: center; gap: 10px;
                    padding: 2rem; background: white; border-radius: 24px; border: 1px solid var(--border-subtle);
                    position: relative;
                }
                :global(.dark) .podium-item { background: var(--bg-panel); border-color: var(--border-light); }
                .place-1 { transform: scale(1.1); z-index: 2; border-color: #f59e0b; box-shadow: 0 20px 40px -15px rgba(245, 158, 11, 0.2); }
                .avatar-wrapper { position: relative; }
                .podium-item .avatar { 
                    width: 80px; height: 80px; border-radius: 50%; background: var(--bg-app); 
                    display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 900; color: var(--primary);
                }
                .podium-item .crown { 
                    position: absolute; -top: 20px; background: #f59e0b; width: 32px; height: 32px; 
                    border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900;
                }
                .ranking-podium { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; padding: 2rem 0; align-items: end; }

                .ranking-table-card { padding: 0 !important; overflow: hidden; }
                .ranking-table { width: 100%; border-collapse: collapse; text-align: left; }
                .ranking-table th { 
                    padding: 1.25rem 1.5rem; background: #fafbfc; font-size: 0.7rem; font-weight: 800; 
                    color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;
                }
                .ranking-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-light); vertical-align: middle; }
                .rank-num { font-weight: 900; color: var(--text-muted); font-size: 1.1rem; }

                .incentives-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
                :global(.incentive-card) { padding: 1.5rem !important; display: flex; flex-direction: column; gap: 1.5rem; }
                .inc-header { display: flex; justify-content: space-between; align-items: flex-start; }
                .btn-redeem {
                    width: 100%; padding: 12px; border-radius: 12px; border: none; background: var(--bg-sidebar);
                    color: white; font-weight: 700; cursor: pointer; transition: 0.2s;
                }
                .btn-redeem:disabled { opacity: 0.5; cursor: not-allowed; }

                .kpi-loading-wrapper { height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; }
                .loader { width: 48px; height: 48px; border: 4px solid var(--primary-soft); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
                
                @keyframes spin { to { transform: rotate(360deg); } }

                @media (max-width: 1024px) {
                    .stats-strip { grid-template-columns: repeat(2, 1fr); }
                    .overview-grid { grid-template-columns: 1fr; }
                    .ranking-podium { grid-template-columns: 1fr; gap: 1rem; }
                    .place-1 { transform: none; }
                }
            `}</style>
        </div>
    );
};

export default KPIDashboard;
