import React, { useState, useEffect, useMemo } from 'react';
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
    Mail,
    Activity,
    RefreshCw,
    FileText,
    LayoutDashboard
} from 'lucide-react';
import { kpiService, empleadoService, authService, planService } from '../../services/api';
import PageHeader from '../Common/PageHeader';
import PremiumCard from '../Common/PremiumCard';
import LoadingSpinner from '../Common/LoadingSpinner';
import EmptyState from '../Common/EmptyState';
import Badge from '../Common/Badge';
import WeekPicker from '../Common/WeekPicker';

const KPIDashboard = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState(null);
    const [incentivos, setIncentivos] = useState([]);
    const [selectedView, setSelectedView] = useState('overview'); // 'overview', 'ranking', 'incentives'

    // Team & Planning Management
    const [allReports, setAllReports] = useState([]); // Para el Ranking real
    const [advisors, setAdvisors] = useState([]);
    const [selectedAdvisorId, setSelectedAdvisorId] = useState(null);
    const [loadingAdvisors, setLoadingAdvisors] = useState(false);
    const [plans, setPlans] = useState([]);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    useEffect(() => {
        const currentUser = authService.getUser();
        setUser(currentUser);
        if (currentUser) {
            if (currentUser.is_admin) {
                fetchAdvisors(currentUser);
            } else {
                setSelectedAdvisorId(currentUser.id_empleado);
                fetchInitialData(currentUser.id_empleado);
            }
        } else {
            setLoading(false);
        }
    }, []);

    const fetchAllReportsForRanking = async (advisorList) => {
        if (!advisorList || advisorList.length === 0) return;
        try {
            const reportsMap = await Promise.all(
                advisorList.map(async (adv) => {
                    const reports = await kpiService.getInformes(0, 10, adv.id_empleado);
                    const totalPoints = reports.reduce((acc, r) => acc + (r.puntos_alcanzados || 0), 0);
                    const avgPerf = reports.length > 0
                        ? reports.reduce((acc, r) => acc + parseFloat(r.porcentaje_alcance || 0), 0) / reports.length
                        : 0;
                    return { id_empleado: adv.id_empleado, totalPoints, avgPerf };
                })
            );
            setAllReports(reportsMap);
        } catch (error) {
            console.error('Error fetching reports for ranking:', error);
        }
    };

    const fetchAdvisors = async (currentUser) => {
        try {
            setLoadingAdvisors(true);
            const data = await empleadoService.getAll();
            setAdvisors(data || []);
            fetchAllReportsForRanking(data || []);

            if (currentUser.id_empleado) {
                setSelectedAdvisorId(currentUser.id_empleado);
                fetchInitialData(currentUser.id_empleado);
            } else if (data.length > 0) {
                setSelectedAdvisorId(data[0].id_empleado);
                fetchInitialData(data[0].id_empleado);
            }
        } catch (error) {
            console.error('Error fetching advisors:', error);
        } finally {
            setLoadingAdvisors(false);
        }
    };

    const fetchInitialData = async (empId) => {
        try {
            setLoading(true);
            setReport(null);
            setPlans([]);
            setSelectedPlanId('');

            // Obtenemos los planes del asesor
            const planesData = await planService.getAll(0, 50, empId);
            setPlans(planesData || []);

            // Obtenemos incentivos reales
            const incData = await kpiService.getIncentivos(empId);
            setIncentivos(incData || []);

            if (planesData && planesData.length > 0) {
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const day = today.getDay() || 7;
                const monday = new Date(today);
                monday.setDate(today.getDate() - day + 1);
                const mondayStr = monday.toISOString().split('T')[0];

                const currentPlan = planesData.find(p => p.fecha_inicio_semana.startsWith(mondayStr));
                const defaultPlanId = currentPlan ? currentPlan.id_plan : planesData[0].id_plan;

                setSelectedPlanId(defaultPlanId);
                await fetchKPIReport(defaultPlanId);
            }
        } catch (error) {
            console.error('Error fetching initial KPI data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchKPIReport = async (planId) => {
        if (!planId) return;
        try {
            setLoading(true);
            const reportData = await kpiService.getInformeByPlan(planId);
            setReport(reportData);
        } catch (error) {
            console.error('Error fetching KPI report:', error);
            setReport(null);
        } finally {
            setLoading(false);
        }
    };

    const handleAdvisorChange = (e) => {
        const val = e.target.value;
        if (!val) return;
        const empId = parseInt(val);
        setSelectedAdvisorId(empId);
        fetchInitialData(empId);
    };

    const handlePlanChange = (planId) => {
        setSelectedPlanId(planId);
        fetchKPIReport(planId);
    };

    // --- INTEGRACIÓN REAL DEL RANKING ---
    const sortedRanking = useMemo(() => {
        return advisors.map(adv => {
            const realData = allReports.find(r => r.id_empleado === adv.id_empleado);
            return {
                ...adv,
                totalPoints: realData?.totalPoints || 0,
                avgPerformance: realData?.avgPerf || 0,
                level: Math.floor((realData?.totalPoints || 0) / 500) + 1 // Regla de negocio simple: 1 nivel cada 500 pts
            };
        }).sort((a, b) => b.totalPoints - a.totalPoints);
    }, [advisors, allReports]);

    const stats = report ? [
        { label: 'Efectividad', value: `${report.porcentaje_alcance || 0}%`, icon: <Target size={20} />, color: '#0ea5e9', growth: 'ALCANCE' },
        { label: 'Puntos Red', value: report.puntos_alcanzados.toString(), icon: <Zap size={20} />, color: '#f59e0b', growth: 'PUNTOS' },
        { label: 'Bonos Gen.', value: `S/ ${(incentivos.filter(i => i.id_plan_origen === report.id_plan).reduce((acc, i) => acc + parseFloat(i.monto_bono), 0)).toFixed(2)}`, icon: <DollarSign size={20} />, color: '#10b981', growth: 'SEMANA' },
        { label: 'Actividades', value: (report.real_visitas + report.real_llamadas + report.real_emails + report.real_cotizaciones).toString(), icon: <Activity size={20} />, color: '#6366f1', growth: 'TOTAL' },
    ] : [];

    return (
        <div className="kpi-premium-view">
            {/* Background Ornaments */}
            <div className="c-bg-blob blob-1" />
            <div className="c-bg-blob blob-2" />
            <div className="c-noise-overlay" />

            <PageHeader
                title="Rendimiento y Gamificación"
                description="Análisis de efectividad basada en el cumplimiento de metas semanales."
                icon={Trophy}
                breadcrumb={['Métricas', 'KPIs']}
            />

            {/* Nueva Sección de Controles Ordenada */}
            <div className="k-header-controls-strip">
                <div className="controls-left">
                    <div className="view-selector-pill">
                        <button className={selectedView === 'overview' ? 'active' : ''} onClick={() => setSelectedView('overview')}>
                            <LayoutDashboard size={18} />
                            <span>Dashboard</span>
                        </button>
                        <button className={selectedView === 'ranking' ? 'active' : ''} onClick={() => setSelectedView('ranking')}>
                            <Trophy size={18} />
                            <span>Ranking</span>
                        </button>
                    </div>
                </div>

                <div className="controls-right">
                    <div className="filters-row">
                        {user?.is_admin && (
                            <div className="advisor-filter-pill">
                                <Activity size={18} className="f-icon" />
                                <div className="f-content">
                                    <span className="f-lbl">Asistente</span>
                                    <select className="minimal-select" value={selectedAdvisorId || ''} onChange={handleAdvisorChange}>
                                        {advisors.map(adv => (
                                            <option key={adv.id_empleado} value={adv.id_empleado}>
                                                {adv.nombre_completo || `${adv.nombres} ${adv.apellidos}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="f-custom-arrow">
                                    <ChevronRight size={14} />
                                </div>
                            </div>
                        )}

                        <div className="week-filter-wrapper">
                            <WeekPicker
                                plans={plans}
                                selectedPlanId={selectedPlanId}
                                onChange={handlePlanChange}
                                isAdmin={user?.is_admin}
                            />
                        </div>

                        <button className="sync-btn-lux" onClick={() => fetchKPIReport(selectedPlanId)} disabled={loading || !selectedPlanId} title="Sincronizar Datos">
                            <RefreshCw size={20} className={loading ? 'spin' : ''} />
                        </button>
                    </div>
                </div>
            </div>

            {loading && !report && plans.length === 0 ? (
                <div className="kpi-loading-wrapper">
                    <LoadingSpinner message="Sincronizando métricas de rendimiento real..." />
                </div>
            ) : report ? (
                <>
                    <div className="stats-hero-strip">
                        <AnimatePresence>
                            {stats.map((stat, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                                    <PremiumCard className="mini-stat-lux">
                                        <div className="icon-box" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                                            {stat.icon}
                                        </div>
                                        <div className="stat-info">
                                            <span className="label">{stat.label}</span>
                                            <div className="value-row">
                                                <span className="value">{stat.value}</span>
                                                <Badge variant="teal" className="growth-badge">{stat.growth}</Badge>
                                            </div>
                                        </div>
                                    </PremiumCard>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence mode="wait">
                        {selectedView === 'overview' && (
                            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="k-view-content">
                                <div className="overview-layout">
                                    <PremiumCard className="main-comparison-card" hover={false}>
                                        <div className="c-card-header">
                                            <h3>Cumplimiento de Objetivos Actual</h3>
                                            <Badge variant="info">Semana Activa</Badge>
                                        </div>

                                        <div className="goals-visualization">
                                            <div className="v-goal-row">
                                                <div className="g-info">
                                                    <div className="g-icon"><Users size={16} /></div>
                                                    <span className="g-name">Visitas Presenciales</span>
                                                </div>
                                                <div className="g-progress-container">
                                                    <div className="g-bar-bg"><div className="fill" style={{ width: `${Math.min((report.real_visitas / report.meta_visitas) * 100, 100)}%` }}></div></div>
                                                    <div className="g-numbers">
                                                        <span className="current">{report.real_visitas}</span>
                                                        <span className="target">/ {report.meta_visitas}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="v-goal-row">
                                                <div className="g-info">
                                                    <div className="g-icon"><Phone size={16} /></div>
                                                    <span className="g-name">Llamadas CRM</span>
                                                </div>
                                                <div className="g-progress-container">
                                                    <div className="g-bar-bg"><div className="fill" style={{ width: `${Math.min((report.real_llamadas / report.meta_llamadas) * 100, 100)}%` }}></div></div>
                                                    <div className="g-numbers">
                                                        <span className="current">{report.real_llamadas}</span>
                                                        <span className="target">/ {report.meta_llamadas}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="v-goal-row">
                                                <div className="g-info">
                                                    <div className="g-icon"><Mail size={16} /></div>
                                                    <span className="g-name">Correos Enviados</span>
                                                </div>
                                                <div className="g-progress-container">
                                                    <div className="g-bar-bg"><div className="fill" style={{ width: `${Math.min((report.real_emails / report.meta_emails) * 100, 100)}%` }}></div></div>
                                                    <div className="g-numbers">
                                                        <span className="current">{report.real_emails}</span>
                                                        <span className="target">/ {report.meta_emails}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="v-goal-row">
                                                <div className="g-info">
                                                    <div className="g-icon"><FileText size={16} /></div>
                                                    <span className="g-name">Cotizaciones</span>
                                                </div>
                                                <div className="g-progress-container">
                                                    <div className="g-bar-bg"><div className="fill" style={{ width: report.meta_cotizaciones > 0 ? `${Math.min((report.real_cotizaciones / report.meta_cotizaciones) * 100, 100)}%` : '0%' }}></div></div>
                                                    <div className="g-numbers">
                                                        <span className="current">{report.real_cotizaciones}</span>
                                                        <span className="target">/ {report.meta_cotizaciones || '-'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </PremiumCard>

                                    <div className="side-dash">
                                        <PremiumCard className="k-score-card">
                                            <div className="score-top">
                                                <Zap size={32} color="#f59e0b" className="zap-glow" />
                                                <div className="score-txt">
                                                    <span className="lbl">Puntaje Acumulado</span>
                                                    <span className="val">{report.puntos_alcanzados}</span>
                                                </div>
                                            </div>
                                            <div className="score-footer">
                                                <div className="p-bar"><div className="p-fill" style={{ width: `${report.porcentaje_alcance}%` }}></div></div>
                                                <span>{report.porcentaje_alcance}% del objetivo semanal</span>
                                            </div>
                                        </PremiumCard>

                                        <PremiumCard className="k-status-card">
                                            <h3>Estado de Bonos</h3>
                                            <div className="bonus-status">
                                                {incentivos.length > 0 ? (
                                                    incentivos.filter(i => i.id_plan_origen === report.id_plan).map(inc => (
                                                        <div key={inc.id_incentivo} className="bonus-item">
                                                            <div className="b-icon"><Medal size={16} /></div>
                                                            <div className="b-meta">
                                                                <span className="b-name">{inc.concepto}</span>
                                                                <span className="b-val">S/ {parseFloat(inc.monto_bono).toFixed(2)}</span>
                                                            </div>
                                                            <Badge variant={inc.estado_pago === 'Pagado' ? 'success' : 'warning'}>{inc.estado_pago}</Badge>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="no-bonus">Aún no se han generado bonos para esta semana.</div>
                                                )}
                                            </div>
                                        </PremiumCard>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {selectedView === 'ranking' && (
                            <motion.div key="ranking" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="k-view-content">
                                <div className="ranking-podium-lux">
                                    {sortedRanking.slice(0, 3).map((emp, i) => (
                                        <div key={emp.id_empleado} className={`podium-box rank-${i + 1}`}>
                                            <div className="avatar-orb">
                                                <div className="initials">{emp.nombre_completo.charAt(0)}</div>
                                                <div className="place-medal">{i === 0 ? <Crown size={22} /> : i + 1}</div>
                                            </div>
                                            <span className="p-name">{emp.nombre_completo}</span>
                                            <span className="p-pts">{emp.totalPoints} PTS</span>
                                            <div className="p-level">NIVEL {emp.level}</div>
                                        </div>
                                    ))}
                                </div>

                                <PremiumCard className="lux-ranking-table-card">
                                    <table className="lux-ranking-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>INTEGRANTE DEL EQUIPO</th>
                                                <th>PRODUCTIVIDAD</th>
                                                <th>PUNTOS</th>
                                                <th className="text-right">ESTADO</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedRanking.map((emp, i) => (
                                                <tr key={emp.id_empleado}>
                                                    <td><span className="rank-idx">{i + 1}</span></td>
                                                    <td>
                                                        <div className="agent-cell">
                                                            <div className="a-mini-avatar">{emp.nombre_completo.charAt(0)}</div>
                                                            <div className="a-info">
                                                                <span className="a-name">{emp.nombre_completo}</span>
                                                                <span className="a-role">{emp.id_empleado === user?.id_empleado ? 'ERES TÚ' : 'ASISTENTE'}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="mini-prog-box">
                                                            <div className="mini-bar"><div className="fill" style={{ width: `${emp.avgPerformance}%` }}></div></div>
                                                            <span className="pct">{emp.avgPerformance}%</span>
                                                        </div>
                                                    </td>
                                                    <td><span className="pts-val">{emp.totalPoints}</span></td>
                                                    <td className="text-right">
                                                        <Badge variant="teal">Activo</Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </PremiumCard>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </>
            ) : (
                <EmptyState
                    icon={BarChart3}
                    title="Sin reporte de actividad"
                    message="No hay un plan semanal seleccionado o el asesor no tiene un informe de KPI para este periodo."
                />
            )}

            <style jsx>{`
                .kpi-premium-view { display: flex; flex-direction: column; gap: 1.5rem; position: relative; min-height: 100vh; padding-bottom: 4rem; }

                /* Ornaments */
                .c-bg-blob { position: fixed; z-index: -2; filter: blur(120px); opacity: 0.1; border-radius: 50%; }
                .blob-1 { top: -10%; right: -5%; width: 600px; height: 600px; background: #6366f1; }
                .blob-2 { bottom: -5%; left: -5%; width: 500px; height: 500px; background: #14b8a6; }
                .c-noise-overlay { position: fixed; inset: 0; z-index: -1; opacity: 0.02; pointer-events: none; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E"); }

                /* Nueva Barra de Controles Optimizada */
                .k-header-controls-strip {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: white;
                    padding: 0.75rem 1.5rem;
                    border-radius: 20px;
                    border: 1px solid var(--border-subtle);
                    box-shadow: var(--shadow-sm);
                    margin-top: -0.5rem;
                }
                :global(.dark) .k-header-controls-strip { background: var(--bg-panel); border-color: var(--border-light); }

                /* Lado Izquierdo: Selectores de Vista */
                .view-selector-pill { display: flex; gap: 4px; padding: 4px; background: var(--bg-app); border-radius: 14px; border: 1px solid var(--border-subtle); }
                .view-selector-pill button {
                    display: flex; align-items: center; gap: 10px; padding: 10px 18px; border: none;
                    background: transparent; color: var(--text-muted); font-weight: 850; font-size: 0.8rem;
                    cursor: pointer; transition: 0.2s; border-radius: 10px;
                }
                .view-selector-pill button.active { background: white; color: var(--primary); box-shadow: var(--shadow-sm); }
                :global(.dark) .view-selector-pill button.active { background: var(--bg-sidebar); color: white; }

                /* Lado Derecho: Filtros y Sync */
                .controls-right { display: flex; align-items: center; }
                .filters-row { display: flex; align-items: stretch; gap: 12px; }

                .advisor-filter-pill {
                    display: flex; align-items: center; gap: 12px; padding: 0 1.25rem;
                    background: white; border-radius: 16px; border: 1px solid var(--border-subtle);
                    height: 54px; min-width: 240px; transition: all 0.2s;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                }
                :global(.dark) .advisor-filter-pill { background: var(--bg-panel); border-color: var(--border-light); }
                .advisor-filter-pill:hover { border-color: var(--primary); background: var(--bg-app); transform: translateY(-1px); }

                .f-icon { color: var(--primary); background: var(--primary-glow); padding: 8px; border-radius: 10px; box-sizing: content-box; flex-shrink: 0; }
                .f-content { display: flex; flex-direction: column; flex: 1; min-width: 0; }
                .f-lbl { font-size: 0.65rem; font-weight: 900; color: var(--text-muted); text-transform: uppercase; margin-bottom: -2px; pointer-events: none; }
                
                .f-custom-arrow { color: var(--text-muted); opacity: 0.5; transform: rotate(90deg); flex-shrink: 0; pointer-events: none; display: flex; align-items: center; justify-content: center; }

                .minimal-select { 
                    background: transparent; border: none; outline: none; font-size: 0.95rem; 
                    font-weight: 850; color: var(--text-heading); cursor: pointer; width: 100%;
                    appearance: none; -webkit-appearance: none; -moz-appearance: none;
                    text-overflow: ellipsis; white-space: nowrap; overflow: hidden;
                    padding-right: 20px;
                }

                :global(.week-picker-container) { height: 54px; }
                :global(.week-picker-container .picker-trigger) { height: 54px; border-radius: 16px !important; }

                .sync-btn-lux {
                    width: 54px; height: 54px; border-radius: 16px; border: none;
                    background: var(--primary-glow); color: var(--primary); display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: all 0.3s; border: 1px solid var(--border-subtle);
                }
                .sync-btn-lux:hover:not(:disabled) { background: var(--primary); color: white; transform: rotate(30deg); border-color: var(--primary); }
                .sync-btn-lux:disabled { opacity: 0.5; cursor: not-allowed; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                /* Stats strip */
                .stats-hero-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
                :global(.mini-stat-lux) { padding: 1.5rem !important; display: flex; align-items: center; gap: 15px; border-radius: 24px !important; }
                .icon-box { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .stat-info { display: flex; flex-direction: column; gap: 2px; }
                .stat-info .label { font-size: 0.65rem; font-weight: 900; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
                .value-row { display: flex; align-items: center; gap: 12px; }
                .value-row .value { font-size: 1.5rem; font-weight: 950; color: var(--text-heading); letter-spacing: -0.02em; }
                :global(.growth-badge) { font-size: 0.6rem !important; padding: 2px 6px !important; }

                .overview-layout { display: grid; grid-template-columns: 1fr 340px; gap: 1.5rem; }
                :global(.main-comparison-card) { padding: 2rem !important; border-radius: 32px !important; }
                .c-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .c-card-header h3 { font-size: 1.1rem; font-weight: 900; color: var(--text-heading); margin: 0; }

                .goals-visualization { display: flex; flex-direction: column; gap: 1.5rem; }
                .v-goal-row { display: flex; flex-direction: column; gap: 10px; }
                .g-info { display: flex; align-items: center; gap: 10px; }
                .g-icon { width: 32px; height: 32px; border-radius: 10px; background: var(--bg-app); display: flex; align-items: center; justify-content: center; color: var(--primary); }
                .g-name { font-size: 0.9rem; font-weight: 800; color: var(--text-heading); }
                .g-progress-container { display: flex; align-items: center; gap: 15px; }
                .g-bar-bg { flex: 1; height: 10px; background: var(--bg-app); border-radius: 10px; overflow: hidden; }
                .g-bar-bg .fill { height: 100%; background: linear-gradient(90deg, var(--primary), #6366f1); transition: width 1s cubic-bezier(0.16, 1, 0.3, 1); }
                .g-numbers { min-width: 80px; text-align: right; }
                .current { font-weight: 950; color: var(--text-heading); font-size: 1.1rem; }
                .target { font-weight: 700; color: var(--text-muted); font-size: 0.8rem; }

                .side-dash { display: flex; flex-direction: column; gap: 1.5rem; }
                :global(.k-score-card) { 
                    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%) !important; 
                    padding: 2rem !important; color: white !important; border-radius: 32px !important;
                    border: none !important;
                }
                .score-top { display: flex; align-items: center; gap: 15px; margin-bottom: 1.5rem; }
                .zap-glow { filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.5)); }
                .score-txt { display: flex; flex-direction: column; }
                .score-txt .lbl { font-size: 0.75rem; font-weight: 800; opacity: 0.7; text-transform: uppercase; }
                .score-txt .val { font-size: 2.8rem; font-weight: 950; letter-spacing: -0.05em; }
                .score-footer { display: flex; flex-direction: column; gap: 10px; }
                .p-bar { height: 6px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; }
                .p-fill { height: 100%; background: #f59e0b; }
                .score-footer span { font-size: 0.75rem; font-weight: 800; opacity: 0.9; }

                :global(.k-status-card) { padding: 1.5rem !important; border-radius: 28px !important; }
                .bonus-status { display: flex; flex-direction: column; gap: 12px; margin-top: 1rem; }
                .bonus-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-app); border-radius: 16px; border: 1px solid var(--border-subtle); }
                .b-icon { color: #f59e0b; }
                .b-meta { flex: 1; display: flex; flex-direction: column; }
                .b-name { font-size: 0.75rem; font-weight: 850; color: var(--text-muted); }
                .b-val { font-size: 0.9rem; font-weight: 900; color: var(--text-heading); }

                /* Ranking Styles */
                .ranking-podium-lux { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; align-items: flex-end; padding: 2rem 0; }
                .podium-box { 
                    display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 2.5rem 1.5rem;
                    background: white; border-radius: 32px; border: 1px solid var(--border-subtle); position: relative;
                }
                :global(.dark) .podium-box { background: var(--bg-panel); border-color: var(--border-light); }
                .rank-1 { transform: scale(1.1); z-index: 2; border-color: #f59e0b; box-shadow: 0 20px 40px -10px rgba(245, 158, 11, 0.2); }
                .avatar-orb { width: 90px; height: 90px; border-radius: 50%; background: var(--bg-app); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: 950; color: var(--primary); position: relative; }
                .place-medal { position: absolute; -top: 15px; width: 40px; height: 40px; background: #f59e0b; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 950; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
                .p-name { font-weight: 900; color: var(--text-heading); font-size: 1rem; text-align: center; }
                .p-pts { font-size: 1.25rem; font-weight: 950; color: var(--primary); }
                .p-level { font-size: 0.7rem; font-weight: 900; background: var(--bg-app); padding: 4px 10px; border-radius: 50px; color: var(--text-muted); }

                .lux-ranking-table-card { padding: 0 !important; border-radius: 32px !important; overflow: hidden; }
                .lux-ranking-table { width: 100%; border-collapse: collapse; }
                .lux-ranking-table th { padding: 1.25rem 2rem; text-align: left; background: #fafbfc; font-size: 0.7rem; font-weight: 900; color: var(--text-muted); text-transform: uppercase; }
                .lux-ranking-table td { padding: 1.25rem 2rem; border-bottom: 1px solid var(--border-light); vertical-align: middle; }
                .rank-idx { font-weight: 950; color: var(--text-muted); font-size: 1.2rem; }
                .agent-cell { display: flex; align-items: center; gap: 15px; }
                .a-mini-avatar { width: 40px; height: 40px; border-radius: 12px; background: var(--bg-app); display: flex; align-items: center; justify-content: center; font-weight: 900; color: var(--primary); }
                .a-info { display: flex; flex-direction: column; }
                .a-name { font-weight: 850; color: var(--text-heading); font-size: 0.95rem; }
                .a-role { font-size: 0.65rem; font-weight: 900; color: var(--primary); text-transform: uppercase; }
                .mini-prog-box { display: flex; align-items: center; gap: 10px; }
                .mini-bar { width: 60px; height: 4px; background: var(--bg-app); border-radius: 10px; overflow: hidden; }
                .mini-bar .fill { height: 100%; background: var(--primary); }
                .pct { font-size: 0.75rem; font-weight: 800; color: var(--text-heading); }

                .kpi-loading-wrapper { height: 70vh; display: flex; align-items: center; justify-content: center; }

                @media (max-width: 1200px) { 
                    .stats-hero-strip { grid-template-columns: repeat(2, 1fr); } 
                    .overview-layout { grid-template-columns: 1fr; } 
                }
                @media (max-width: 768px) { 
                    .stats-hero-strip { grid-template-columns: 1fr; } 
                    .ranking-podium-lux { grid-template-columns: 1fr; gap: 1rem; }
                    .rank-1 { transform: none; }
                    .k-header-controls-strip { flex-direction: column; gap: 1rem; align-items: stretch; }
                    .controls-right { justify-content: space-between; }
                }
            `}</style>
        </div >
    );
};

export default KPIDashboard;
