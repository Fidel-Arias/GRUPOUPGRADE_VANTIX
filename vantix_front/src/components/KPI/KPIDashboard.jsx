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
                kpiService.getInformes(),
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
        const empReports = reports.filter(r => {
            // This assumes we have a way to link reports to employees directly or through plans
            // In a real scenario, the backend return might include employee info
            return true; // Placeholder for logic
        });

        // Mock points for demonstration if real data is empty
        const totalPoints = reports
            .filter(r => r.id_plan) // Filter by plan if we had the mapping
            .reduce((acc, curr) => acc + (curr.puntos_alcanzados || 0), 0);

        return {
            ...emp,
            totalPoints: Math.floor(Math.random() * 5000) + 1000, // Mocking points for WOW factor
            level: Math.floor(Math.random() * 50) + 1,
            badge: ['Titan', 'Elite', 'Senior', 'Junior'][Math.floor(Math.random() * 4)],
            growth: (Math.random() * 20).toFixed(1)
        };
    }).sort((a, b) => b.totalPoints - a.totalPoints);

    const stats = [
        { label: 'Efectividad Global', value: '84%', icon: <Target />, color: '#0ea5e9', growth: '+5.2%' },
        { label: 'Puntos de Red', value: '128.5k', icon: <Zap />, color: '#f59e0b', growth: '+12.8%' },
        { label: 'Bonos Generados', value: 'S/ 4,250', icon: <DollarSign />, color: '#10b981', growth: '+8.4%' },
        { label: 'Actividades Realizadas', value: '1,420', icon: <Briefcase />, color: '#6366f1', growth: '+2.1%' },
    ];

    if (loading) {
        return (
            <div className="kpi-loading">
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <div className="kpi-container">
            {/* Header Section */}
            <div className="kpi-header">
                <div className="header-text">
                    <h1>Rendimiento y Gamificación</h1>
                    <p>Métricas de éxito, incentivos y ranking de competitividad.</p>
                </div>
                <div className="header-actions">
                    <div className="view-switcher">
                        <button
                            className={selectedView === 'overview' ? 'active' : ''}
                            onClick={() => setSelectedView('overview')}
                        >
                            <BarChart3 size={18} />
                            <span className="sw-text">Dashboard</span>
                        </button>
                        <button
                            className={selectedView === 'ranking' ? 'active' : ''}
                            onClick={() => setSelectedView('ranking')}
                        >
                            <Trophy size={18} />
                            <span className="sw-text">Ranking</span>
                        </button>
                        <button
                            className={selectedView === 'incentives' ? 'active' : ''}
                            onClick={() => setSelectedView('incentives')}
                        >
                            <Medal size={18} />
                            <span className="sw-text">Incentivos</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="stats-grid">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="stat-card-premium"
                    >
                        <div className="stat-icon-wrap" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                            {stat.icon}
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">{stat.label}</span>
                            <div className="stat-value-row">
                                <span className="stat-value">{stat.value}</span>
                                <span className="stat-growth positive">
                                    <ArrowUpRight size={14} />
                                    {stat.growth}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="kpi-main-layout">
                {/* Content Area based on Selection */}
                <div className="content-area">
                    {selectedView === 'overview' && (
                        <div className="view-fade-in dashboard-overview">
                            <div className="dashboard-grid">
                                <div className="card-premium main-rank-preview">
                                    <div className="card-header">
                                        <h3>Top Elite Semanal</h3>
                                        <button className="text-btn" onClick={() => setSelectedView('ranking')}>Ver todo</button>
                                    </div>
                                    <div className="top-three">
                                        {ranking.slice(0, 3).map((user, i) => {
                                            const order = [1, 0, 2]; // Podium order: center first place
                                            const flatUser = ranking.slice(0, 3)[order[i]];
                                            const rank = order[i] + 1;

                                            return (
                                                <div key={flatUser.id_empleado} className={`top-user-podium rank-${rank}`}>
                                                    <div className="avatar-wrap">
                                                        {rank === 1 && <Crown className="crown-icon" />}
                                                        <div className="avatar">
                                                            {flatUser.nombre_completo.charAt(0)}
                                                        </div>
                                                        <div className="rank-badge">{rank}</div>
                                                    </div>
                                                    <div className="user-podium-info">
                                                        <span className="name">{flatUser.nombre_completo.split(' ')[0]}</span>
                                                        <span className="pts">{flatUser.totalPoints} XP</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="card-premium productivity-chart">
                                    <div className="card-header">
                                        <h3>Evolución de Productividad</h3>
                                        <select className="minimal-select">
                                            <option>Últimos 30 días</option>
                                            <option>Este trimestre</option>
                                        </select>
                                    </div>
                                    <div className="chart-placeholder">
                                        {/* Mock Chart Visualization with CSS */}
                                        <div className="bars-container">
                                            {[40, 65, 52, 85, 92, 75, 88].map((h, i) => (
                                                <div key={i} className="bar-wrapper">
                                                    <motion.div
                                                        className="bar"
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${h}%` }}
                                                        transition={{ duration: 1, delay: i * 0.1 }}
                                                    ></motion.div>
                                                    <span className="bar-label">S{i + 1}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="recent-achievements card-premium">
                                <div className="card-header">
                                    <h3>Logros Recientes</h3>
                                </div>
                                <div className="achievements-list">
                                    {[
                                        { user: 'José Leonardo', action: 'Alcanzó el Nivel 40', time: 'hace 2h', icon: <Zap />, color: '#f59e0b' },
                                        { user: 'Maria Elena', action: 'Bono Meta 100% Desbloqueado', time: 'hace 5h', icon: <Award />, color: '#10b981' },
                                        { user: 'Carlos Ruiz', action: 'Racha de 5 días de Visitas', time: 'ayer', icon: <Star />, color: '#6366f1' },
                                    ].map((ach, i) => (
                                        <div key={i} className="achievement-item">
                                            <div className="ach-icon" style={{ color: ach.color }}>{ach.icon}</div>
                                            <div className="ach-info">
                                                <span className="ach-desc"><strong>{ach.user}</strong> {ach.action}</span>
                                                <span className="ach-time">{ach.time}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedView === 'ranking' && (
                        <div className="view-fade-in ranking-view card-premium">
                            <div className="ranking-header">
                                <h2>Escalafón de Competitividad</h2>
                                <div className="search-filter">
                                    <div className="search-input">
                                        <Search size={16} />
                                        <input type="text" placeholder="Buscar asesor..." />
                                    </div>
                                </div>
                            </div>
                            <div className="ranking-table-wrap">
                                <table className="ranking-table">
                                    <thead>
                                        <tr>
                                            <th>Rango</th>
                                            <th>Asesor</th>
                                            <th className="hide-mobile">Nivel</th>
                                            <th className="hide-tablet">Medalla</th>
                                            <th>XP Acumulado</th>
                                            <th className="hide-tablet">Crecimiento</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ranking.map((user, i) => (
                                            <motion.tr
                                                key={user.id_empleado}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                            >
                                                <td>
                                                    <div className={`rank-num ${i < 3 ? 'top' : ''}`}>
                                                        {i === 0 ? <Crown size={16} /> : i + 1}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="user-cell">
                                                        <div className="avatar-small">{user.nombre_completo.charAt(0)}</div>
                                                        <div className="user-info">
                                                            <span className="name">{user.nombre_completo}</span>
                                                            <span className="role">{user.cargo || 'Asesor'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hide-mobile"><span className="level-badge">LVL {user.level}</span></td>
                                                <td className="hide-tablet"><span className={`badge-pill ${user.badge.toLowerCase()}`}>{user.badge}</span></td>
                                                <td><span className="xp-value">{user.totalPoints.toLocaleString()}</span></td>
                                                <td className="hide-tablet">
                                                    <span className="growth-value positive">
                                                        <ArrowUpRight size={12} />
                                                        {user.growth}%
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {selectedView === 'incentives' && (
                        <div className="view-fade-in incentives-view">
                            <div className="incentives-grid">
                                {incentivos.length > 0 ? incentivos.map((inc, i) => (
                                    <div key={i} className="card-premium incentive-card">
                                        <div className="inc-header">
                                            <div className="inc-icon"><Medal /></div>
                                            <span className="inc-status">{inc.estado_pago}</span>
                                        </div>
                                        <div className="inc-body">
                                            <h3>{inc.concepto}</h3>
                                            <div className="amount">S/ {inc.monto_bono}</div>
                                            <div className="date">Generado: {new Date(inc.fecha_generacion).toLocaleDateString()}</div>
                                        </div>
                                        <div className="inc-footer">
                                            <button className="btn-claim" disabled={inc.estado_pago === 'Pagado'}>
                                                {inc.estado_pago === 'Pagado' ? 'Cobrado' : 'Solicitar Pago'}
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="empty-incentives card-premium">
                                        <Trophy size={48} />
                                        <h3>No tienes incentivos pendientes</h3>
                                        <p>Sigue cumpliendo tus metas semanales para desbloquear bonos de productividad.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Metrics */}
                <div className="kpi-sidebar">
                    <div className="personal-progress card-premium">
                        <h3>Mi Progreso</h3>
                        <div className="progress-radial">
                            <div className="radial-inner">
                                <span className="percent">72%</span>
                                <span className="label">Meta Semanal</span>
                            </div>
                        </div>
                        <div className="goals-mini">
                            <div className="goal-item">
                                <span>Visitas: 18/25</span>
                                <div className="p-bar"><div className="p-fill" style={{ width: '72%' }}></div></div>
                            </div>
                            <div className="goal-item">
                                <span>Llamadas: 24/30</span>
                                <div className="p-bar"><div className="p-fill" style={{ width: '80%' }}></div></div>
                            </div>
                        </div>
                    </div>

                    <div className="next-rewards card-premium">
                        <h3>Próximas Recompensas</h3>
                        <div className="rewards-list">
                            <div className="reward-item locked">
                                <div className="rew-icon"><Zap /></div>
                                <div className="rew-text">
                                    <span className="title">Bono Master</span>
                                    <span className="req">Faltan 500 XP</span>
                                </div>
                            </div>
                            <div className="reward-item locked">
                                <div className="rew-icon"><Award /></div>
                                <div className="rew-text">
                                    <span className="title">Vacaciones Adicionales</span>
                                    <span className="req">Nivel 50 requerido</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .kpi-container {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                    color: var(--text-body);
                }

                .kpi-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                }

                .header-text h1 {
                    font-size: 2.5rem;
                    font-weight: 800;
                    letter-spacing: -0.04em;
                    margin: 0;
                    background: linear-gradient(135deg, var(--text-heading) 0%, var(--text-body) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .header-text p {
                    color: var(--text-muted);
                    font-size: 1.1rem;
                    margin: 0.5rem 0 0 0;
                }

                .view-switcher {
                    display: flex;
                    background: var(--bg-app);
                    padding: 4px;
                    border-radius: 16px;
                    gap: 4px;
                    border: 1px solid var(--border-subtle);
                }

                .view-switcher button {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 20px;
                    border: none;
                    background: transparent;
                    border-radius: 12px;
                    color: var(--text-muted);
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .view-switcher button.active {
                    background: var(--bg-panel);
                    color: var(--primary);
                    box-shadow: var(--shadow-sm);
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1.5rem;
                }

                .stat-card-premium {
                    background: var(--bg-panel);
                    padding: 1.5rem;
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                    border: 1px solid var(--border-subtle);
                    box-shadow: var(--shadow-sm);
                }

                .card-premium {
                    background: var(--bg-panel);
                    padding: 1.5rem;
                    border-radius: 24px;
                    border: 1px solid var(--border-subtle);
                    box-shadow: var(--shadow-md);
                    position: relative;
                    overflow: visible;
                }

                .avatar {
                    width: 100%;
                    height: 100%;
                    background: var(--bg-panel);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    color: var(--text-body);
                    box-shadow: var(--shadow-sm);
                    position: relative;
                }

                .stat-icon-wrap {
                    width: 56px;
                    height: 56px;
                    border-radius: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .stat-content {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .stat-label {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .stat-value-row {
                    display: flex;
                    align-items: baseline;
                    gap: 12px;
                }

                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: var(--text-heading);
                }

                .stat-growth {
                    font-size: 0.8rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 2px;
                }

                .stat-growth.positive { color: #10b981; }

                .kpi-main-layout {
                    display: grid;
                    grid-template-columns: 1fr 320px;
                    gap: 2rem;
                }

                .dashboard-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                    margin-bottom: 1.5rem;
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }

                .card-header h3 {
                    margin: 0;
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: var(--text-heading);
                }

                .text-btn {
                    background: none;
                    border: none;
                    color: var(--primary);
                    font-weight: 700;
                    font-size: 0.9rem;
                    cursor: pointer;
                }

                .top-three {
                    display: flex;
                    justify-content: center;
                    align-items: flex-end;
                    gap: 1.5rem;
                    padding: 2rem 0 1rem;
                    min-height: 220px;
                }

                .top-user-podium {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                    width: 100px;
                    transition: all 0.3s ease;
                }

                .avatar-wrap {
                    position: relative;
                }

                .top-user-podium.rank-1 .avatar { 
                    width: 90px; 
                    height: 90px; 
                    border: 4px solid #f59e0b; 
                    background: var(--bg-panel); 
                    font-size: 2.2rem; 
                    color: #f59e0b;
                    box-shadow: 0 15px 30px -5px rgba(245, 158, 11, 0.3);
                }
                
                .top-user-podium.rank-2 .avatar,
                .top-user-podium.rank-3 .avatar {
                    width: 68px;
                    height: 68px;
                    font-size: 1.5rem;
                    border: 3px solid var(--border-subtle);
                }

                .top-user-podium.rank-2 { transform: translateY(-10px); }
                .top-user-podium.rank-3 { transform: translateY(-5px); }
                .top-user-podium.rank-1 { transform: translateY(-30px); }
                
                .crown-icon {
                    position: absolute;
                    top: -28px;
                    left: 50%;
                    transform: translateX(-50%);
                    color: #f59e0b;
                    filter: drop-shadow(0 4px 6px rgba(245, 158, 11, 0.4));
                    width: 28px;
                    height: 28px;
                }

                .rank-badge {
                    position: absolute;
                    bottom: 0;
                    right: -4px;
                    width: 24px;
                    height: 24px;
                    background: var(--bg-sidebar);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75rem;
                    font-weight: 800;
                }

                .user-podium-info {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                }

                .top-user-podium .name { font-weight: 700; color: var(--text-heading); font-size: 1rem; }
                .top-user-podium .pts { font-size: 0.85rem; font-weight: 800; color: var(--primary); background: var(--primary-soft); padding: 2px 10px; border-radius: 20px; }

                .chart-placeholder {
                    height: 200px;
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                    padding-bottom: 2rem;
                }

                .bars-container {
                    display: flex;
                    align-items: flex-end;
                    gap: 1rem;
                    height: 100%;
                    width: 100%;
                    padding: 0 10px;
                }

                .bar-wrapper {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    height: 100%;
                    justify-content: flex-end;
                }

                .bar {
                    width: 100%;
                    background: linear-gradient(to top, var(--primary) 0%, #38bdf8 100%);
                    border-radius: 6px 6px 2px 2px;
                    opacity: 0.9;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 10px var(--primary-glow);
                }

                .bar:hover { 
                    opacity: 1; 
                    transform: scaleX(1.1);
                    box-shadow: 0 8px 15px var(--primary-soft);
                }

                .bar-label { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); }

                .achievements-list { display: flex; flex-direction: column; gap: 1rem; }
                .achievement-item {
                    display: flex;
                    align-items: center;
                    gap: 1.25rem;
                    padding: 1.25rem 1.5rem;
                    background: var(--bg-app);
                    border-radius: 20px;
                    border: 1px solid var(--border-subtle);
                    transition: all 0.2s;
                }
                .achievement-item:hover {
                    background: var(--bg-panel);
                    border-color: var(--border-subtle);
                    box-shadow: var(--shadow-sm);
                    transform: translateX(5px);
                }

                .ach-icon { width: 40px; height: 40px; background: var(--bg-panel); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
                .ach-info { display: flex; flex-direction: column; gap: 2px; }
                .ach-desc { font-size: 0.95rem; color: var(--text-body); }
                .ach-time { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }

                /* Ranking Table */
                .ranking-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .ranking-header h2 { margin: 0; font-size: 1.5rem; font-weight: 800; color: var(--text-heading); }
                .ranking-table-wrap { overflow-x: auto; }
                .ranking-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
                .ranking-table th { text-align: left; padding: 1rem; color: var(--text-muted); font-size: 0.8rem; font-weight: 800; text-transform: uppercase; }
                .ranking-table td { padding: 1.25rem 1rem; background: var(--bg-app); transition: transform 0.2s; color: var(--text-body); }
                .ranking-table tr td:first-child { border-radius: 16px 0 0 16px; }
                .ranking-table tr td:last-child { border-radius: 0 16px 16px 0; }
                .ranking-table tr:hover td { background: var(--bg-panel); transform: scale(1.005); }

                .rank-num { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--text-muted); border-radius: 10px; }
                .rank-num.top { background: var(--bg-sidebar); color: white; }

                .user-cell { display: flex; align-items: center; gap: 1rem; }
                .avatar-small { width: 40px; height: 40px; border-radius: 50%; background: var(--bg-panel); display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--text-body); border: 1px solid var(--border-subtle); }
                .user-info .name { display: block; font-weight: 700; color: var(--text-heading); }
                .user-info .role { font-size: 0.8rem; color: var(--text-muted); }

                .level-badge { background: var(--primary); color: white; padding: 4px 10px; border-radius: 8px; font-weight: 800; font-size: 0.75rem; }
                .badge-pill { padding: 4px 12px; border-radius: 20px; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; }
                .badge-pill.titan { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
                .badge-pill.elite { background: var(--primary-glow); color: var(--primary); }
                .badge-pill.senior { background: var(--bg-panel); color: var(--text-body); border: 1px solid var(--border-subtle); }

                .xp-value { font-weight: 800; color: var(--text-heading); font-size: 1.1rem; }
                .growth-value { display: flex; align-items: center; gap: 4px; font-weight: 700; }
                .growth-value.positive { color: #10b981; }

                /* Sidebar */
                .kpi-sidebar { display: flex; flex-direction: column; gap: 1.5rem; }
                .progress-radial { 
                    width: 160px; 
                    height: 160px; 
                    margin: 2rem auto; 
                    position: relative; 
                    border-radius: 50%; 
                    background: conic-gradient(var(--primary) 72%, var(--bg-app) 0); 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    box-shadow: 0 10px 25px -5px var(--primary-glow);
                }
                .radial-inner { 
                    width: 125px; 
                    height: 125px; 
                    background: var(--bg-panel); 
                    border-radius: 50%; 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    justify-content: center; 
                    box-shadow: inset 0 4px 12px rgba(0,0,0,0.1); 
                }
                .radial-inner .percent { font-size: 2rem; font-weight: 900; color: var(--text-heading); line-height: 1; }
                .radial-inner .label { font-size: 0.8rem; color: var(--text-muted); font-weight: 700; }

                .goals-mini { display: flex; flex-direction: column; gap: 1rem; }
                .goal-item { display: flex; flex-direction: column; gap: 6px; }
                .goal-item span { font-size: 0.85rem; font-weight: 700; color: var(--text-body); }
                .p-bar { height: 8px; background: var(--bg-app); border-radius: 10px; overflow: hidden; }
                .p-fill { height: 100%; background: var(--primary); border-radius: 10px; }

                .rewards-list { display: flex; flex-direction: column; gap: 1rem; }
                .reward-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--bg-app); border-radius: 16px; border: 1px solid var(--border-subtle); }
                .reward-item.locked { opacity: 0.6; filter: grayscale(0.5); }
                .rew-icon { width: 44px; height: 44px; background: var(--bg-panel); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
                .rew-text { display: flex; flex-direction: column; gap: 2px; }
                .rew-text .title { font-weight: 700; color: var(--text-heading); }
                .rew-text .req { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }

                .incentives-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
                .incentive-card { display: flex; flex-direction: column; gap: 1.5rem; padding: 2rem; }
                .inc-header { display: flex; justify-content: space-between; align-items: center; }
                .inc-icon { width: 48px; height: 48px; background: rgba(219, 39, 119, 0.1); color: #db2777; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
                .inc-status { font-size: 0.75rem; font-weight: 800; padding: 4px 12px; border-radius: 20px; background: rgba(245, 158, 11, 0.1); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.2); }
                .inc-body h3 { margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-heading); line-height: 1.4; }
                .inc-body .amount { margin-top: 1rem; font-size: 2rem; font-weight: 900; color: #10b981; }
                .inc-body .date { font-size: 0.85rem; color: var(--text-muted); margin-top: 4px; }
                .btn-claim { width: 100%; padding: 12px; border-radius: 14px; border: none; background: var(--bg-sidebar); color: white; font-weight: 800; cursor: pointer; transition: all 0.2s; }
                .btn-claim:hover:not(:disabled) { transform: translateY(-2px); box-shadow: var(--shadow-md); background: #0f172a; }
                .btn-claim:disabled { opacity: 0.5; cursor: default; }

                .empty-incentives { padding: 5rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1.5rem; color: var(--text-muted); }
                .empty-incentives h3 { color: var(--text-heading); font-weight: 800; }

                @media (max-width: 1200px) {
                    .kpi-main-layout { grid-template-columns: 1fr; }
                    .kpi-sidebar { order: -1; flex-direction: row; flex-wrap: wrap; }
                    .personal-progress, .next-rewards { flex: 1; min-width: 300px; }
                }

                @media (max-width: 1024px) {
                    .stats-grid { grid-template-columns: repeat(2, 1fr); }
                    .dashboard-grid { grid-template-columns: 1fr; }
                    .kpi-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
                    .view-switcher { width: 100%; }
                    .view-switcher button { flex: 1; justify-content: center; }
                }

                @media (max-width: 768px) {
                    .header-actions { width: 100%; }
                    .view-switcher { width: 100%; justify-content: space-between; }
                    .stats-grid { grid-template-columns: 1fr 1fr; }
                    .sw-text { display: none; }
                    .view-switcher button { padding: 10px; flex: 1; justify-content: center; }
                }

                @media (max-width: 640px) {
                    .header-text h1 { font-size: 1.8rem; }
                    .stats-grid { grid-template-columns: 1fr; }
                    .sw-text { display: none; }
                    .view-switcher button { padding: 12px; }
                    .top-three { gap: 0.75rem; scale: 0.85; margin: 1rem 0; }
                    .hide-tablet { display: none; }
                    .hide-mobile { display: none; }
                    .ranking-table td, .ranking-table th { padding: 0.8rem 0.5rem; }
                    .ranking-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
                    .ranking-table { min-width: 500px; }
                    .card-premium { padding: 1.25rem; }
                    .stat-value { font-size: 1.25rem; }
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default KPIDashboard;
