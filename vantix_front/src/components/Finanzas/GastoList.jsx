import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet,
    Calendar,
    Search,
    RefreshCw,
    TrendingUp,
    MapPin,
    ArrowRight,
    Building2,
    FileText,
    Clock,
    Activity,
    CreditCard
} from 'lucide-react';
import { finanzasService, planService, authService, empleadoService } from '../../services/api';
import PageHeader from '../Common/PageHeader';
import PremiumCard from '../Common/PremiumCard';
import LoadingSpinner from '../Common/LoadingSpinner';
import EmptyState from '../Common/EmptyState';
import Badge from '../Common/Badge';
import WeekPicker from '../Common/WeekPicker';

const GastoList = () => {
    const [user, setUser] = useState(null);
    const [gastos, setGastos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Team & Planning Management
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

    const fetchAdvisors = async (currentUser) => {
        try {
            setLoadingAdvisors(true);
            const data = await empleadoService.getAll();
            setAdvisors(data);

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
            setGastos([]);
            setPlans([]);
            setSelectedPlanId('');

            // Obtenemos los planes del asesor para el selector de semanas
            const planesData = await planService.getAll(0, 50, empId);
            setPlans(planesData || []);

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
                await fetchGastos(defaultPlanId);
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchGastos = async (planId) => {
        if (!planId) return;
        try {
            setLoading(true);
            const data = await finanzasService.getAll(planId);
            setGastos(data || []);
        } catch (error) {
            console.error('Error fetching gastos:', error);
            setGastos([]);
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
        fetchGastos(planId);
    };

    const totalGastado = gastos.reduce((acc, curr) => acc + parseFloat(curr.monto_gastado), 0);

    return (
        <div className="finanzas-premium-view">
            {/* Background Ornaments */}
            <div className="c-bg-blob blob-1" />
            <div className="c-bg-blob blob-2" />
            <div className="c-noise-overlay" />

            <PageHeader
                title="Gestión de Gastos"
                description="Seguimiento detallado de movilidad y reembolsos basados en el plan semanal."
                icon={Wallet}
                breadcrumb={['Apps', 'Finanzas']}
                actions={
                    <div className="c-master-controls">
                        {user?.is_admin && (
                            <div className="control-group glass advisor-select-wrapper">
                                <div className="advisor-icon">
                                    <Activity size={16} />
                                </div>
                                <select
                                    className="advisor-select-minimal"
                                    value={selectedAdvisorId || ''}
                                    onChange={handleAdvisorChange}
                                >
                                    {loadingAdvisors && advisors.length === 0 ? (
                                        <option value="">Cargando equipo...</option>
                                    ) : (
                                        advisors.map(adv => (
                                            <option key={adv.id_empleado} value={adv.id_empleado}>
                                                {adv.nombre_completo || `${adv.nombres} ${adv.apellidos}`}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                        )}
                        <div className="control-group glass">
                            <WeekPicker
                                plans={plans}
                                selectedPlanId={selectedPlanId}
                                onChange={handlePlanChange}
                                isAdmin={user?.is_admin}
                            />
                        </div>
                        <button
                            className="refresh-btn-glass"
                            onClick={() => fetchGastos(selectedPlanId)}
                            disabled={loading || !selectedPlanId}
                        >
                            <RefreshCw size={18} className={loading ? 'spin' : ''} />
                        </button>
                    </div>
                }
            />

            {/* Stats Dashboard */}
            <div className="stats-hero-grid">
                <PremiumCard className="hero-stat-card" hover={false}>
                    <div className="stat-icon-box main">
                        <CreditCard size={24} />
                    </div>
                    <div className="stat-content">
                        <label>Gastos de la Semana</label>
                        <div className="value-row">
                            <span className="value">S/ {totalGastado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                    <div className="stat-visual-glow" />
                </PremiumCard>

                <PremiumCard className="hero-stat-card success" hover={false}>
                    <div className="stat-icon-box green">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-content">
                        <label>Registros Totales</label>
                        <div className="value-row">
                            <span className="value">{gastos.length}</span>
                            <span className="unit">MOVIMIENTOS</span>
                        </div>
                    </div>
                    <div className="stat-visual-glow green" />
                </PremiumCard>

                <PremiumCard className="hero-stat-card info" hover={false}>
                    <div className="stat-icon-box blue">
                        <MapPin size={24} />
                    </div>
                    <div className="stat-content">
                        <label>Instituciones Visitadas</label>
                        <div className="value-row">
                            <span className="value">{new Set(gastos.map(g => g.institucion_visitada)).size}</span>
                            <span className="unit">LOCALES</span>
                        </div>
                    </div>
                    <div className="stat-visual-glow blue" />
                </PremiumCard>
            </div>

            <div className="data-layout">
                {loading ? (
                    <div className="loading-wrapper">
                        <LoadingSpinner message="Consultando reportes financieros..." />
                    </div>
                ) : !selectedPlanId ? (
                    <EmptyState
                        icon={Calendar}
                        title="Selecciona una semana"
                        message="Para visualizar los gastos de movilidad, debes seleccionar una semana con plan de trabajo activo."
                    />
                ) : gastos.length === 0 ? (
                    <EmptyState
                        icon={Wallet}
                        title="Sin gastos detectados"
                        message="No se han registrado movimientos de movilidad para la semana seleccionada."
                    />
                ) : (
                    <motion.div
                        className="gastos-grid"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <AnimatePresence mode="popLayout">
                            {gastos.map((g, idx) => (
                                <motion.div
                                    key={g.id_gasto}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <PremiumCard className="gasto-lux-card">
                                        <div className="card-top">
                                            <div className="date-badge">
                                                <Calendar size={14} />
                                                <div className="date-time-group">
                                                    <span>{new Date(g.fecha_gasto).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                                                    {g.hora_registro && (
                                                        <>
                                                            <span className="time-sep">•</span>
                                                            <span className="time-val">{g.hora_registro.slice(0, 5)}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <Badge variant="teal">S/ {parseFloat(g.monto_gastado).toFixed(2)}</Badge>
                                        </div>

                                        <div className="route-viz">
                                            <div className="point-item">
                                                <div className="node start"></div>
                                                <div className="point-info">
                                                    <span className="node-lbl">Origen</span>
                                                    <span className="node-val">{g.lugar_origen}</span>
                                                </div>
                                            </div>
                                            <div className="path">
                                                <ArrowRight size={14} />
                                            </div>
                                            <div className="point-item">
                                                <div className="node end"></div>
                                                <div className="point-info">
                                                    <span className="node-lbl">Destino</span>
                                                    <span className="node-val">{g.lugar_destino}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="details-box">
                                            <div className="detail-item">
                                                <Building2 size={16} className="d-icon" />
                                                <div className="d-text">
                                                    <span className="d-lbl">Institución</span>
                                                    <span className="d-val">{g.institucion_visitada}</span>
                                                </div>
                                            </div>
                                            <div className="detail-item">
                                                <FileText size={16} className="d-icon" />
                                                <div className="d-text">
                                                    <span className="d-lbl">Motivo</span>
                                                    <span className="d-val">{g.motivo_visita}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="card-foot">
                                            <div className="meta-audit">
                                                <Clock size={12} />
                                                <span>{g.hora_registro ? `Automático: ${g.hora_registro.slice(0, 5)}` : 'Auditado por Sistema'}</span>
                                            </div>
                                            <div className="plan-tag">
                                                <Badge variant="info">PLAN #{g.id_plan}</Badge>
                                            </div>
                                        </div>
                                    </PremiumCard>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>

            <style jsx>{`
                .finanzas-premium-view {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    gap: 2.5rem;
                    min-height: 100vh;
                    padding-bottom: 4rem;
                }

                /* Ornaments */
                .c-bg-blob {
                    position: fixed;
                    z-index: -2;
                    filter: blur(120px);
                    opacity: 0.1;
                    border-radius: 50%;
                }
                .blob-1 { top: -10%; right: -5%; width: 600px; height: 600px; background: #6366f1; }
                .blob-2 { bottom: -5%; left: -5%; width: 500px; height: 500px; background: #14b8a6; }
                
                .c-noise-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: -1;
                    opacity: 0.02;
                    pointer-events: none;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
                }

                .c-master-controls {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-wrap: wrap;
                    justify-content: flex-end;
                    z-index: 1001;
                    position: relative;
                }

                .control-group.glass {
                    background: rgba(255, 255, 255, 0.4);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    height: 48px;
                    padding: 0 12px;
                }

                .advisor-select-wrapper {
                    min-width: 220px;
                    gap: 8px;
                }

                .advisor-icon { color: var(--primary); display: flex; align-items: center; opacity: 0.8; }
                .advisor-select-minimal {
                    background: transparent;
                    border: none;
                    outline: none;
                    font-size: 0.85rem;
                    font-weight: 800;
                    color: var(--text-heading);
                    padding: 8px 4px;
                    cursor: pointer;
                    flex: 1;
                }
                :global(.dark) .advisor-select-minimal { color: white; }

                .refresh-btn-glass {
                    width: 48px;
                    height: 48px;
                    border-radius: 16px;
                    background: rgba(255, 255, 255, 0.4);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary);
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .refresh-btn-glass:hover:not(:disabled) {
                    background: white;
                    transform: rotate(30deg);
                }
                .refresh-btn-glass:disabled { opacity: 0.5; cursor: not-allowed; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                /* Stats grid */
                .stats-hero-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1.5rem;
                }
                :global(.hero-stat-card) {
                    padding: 2rem !important;
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    position: relative;
                    overflow: hidden;
                    border-radius: 28px !important;
                }
                .stat-icon-box {
                    width: 64px; height: 64px; border-radius: 20px;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .stat-icon-box.main { background: #eff6ff; color: #3b82f6; }
                .stat-icon-box.green { background: #ecfdf5; color: #10b981; }
                .stat-icon-box.blue { background: #f0f9ff; color: #0ea5e9; }

                .stat-content { display: flex; flex-direction: column; gap: 4px; flex: 1; z-index: 1; }
                .stat-content label { font-size: 0.75rem; font-weight: 850; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
                .value-row { display: flex; align-items: baseline; gap: 8px; }
                .value { font-size: 2.2rem; font-weight: 950; color: var(--text-heading); letter-spacing: -0.03em; line-height: 1; }
                .unit { font-size: 0.7rem; font-weight: 800; color: var(--text-muted); }

                .stat-visual-glow {
                    position: absolute; right: -20px; top: -20px; width: 120px; height: 120px;
                    background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
                    pointer-events: none;
                }
                .stat-visual-glow.green { background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%); }
                .stat-visual-glow.blue { background: radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%); }

                /* Gastos Grid */
                .gastos-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 1.5rem;
                }

                :global(.gasto-lux-card) {
                    padding: 1.75rem !important;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    border-radius: 28px !important;
                }

                .card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .date-badge {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.8rem;
                    font-weight: 850;
                    color: var(--text-muted);
                    background: var(--bg-app);
                    padding: 6px 12px;
                    border-radius: 12px;
                }
                .date-time-group { display: flex; align-items: center; gap: 4px; }
                .time-sep { opacity: 0.3; font-weight: 400; }
                .time-val { color: var(--primary); opacity: 0.9; }

                .route-viz {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: #f8fafc;
                    padding: 16px;
                    border-radius: 20px;
                    border: 1px solid var(--border-subtle);
                }
                :global(.dark) .route-viz { background: rgba(255,255,255,0.03); }
                
                .point-item { flex: 1; display: flex; align-items: flex-start; gap: 10px; }
                .node { width: 10px; height: 10px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
                .node.start { background: #6366f1; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15); }
                .node.end { background: #14b8a6; box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.15); }
                
                .point-info { display: flex; flex-direction: column; gap: 2px; }
                .node-lbl { font-size: 0.65rem; font-weight: 900; color: var(--text-muted); text-transform: uppercase; }
                .node-val { font-size: 0.85rem; font-weight: 700; color: var(--text-heading); line-height: 1.2; }
                .path { color: var(--text-muted); opacity: 0.4; }

                .details-box { display: flex; flex-direction: column; gap: 12px; }
                .detail-item { display: flex; gap: 12px; align-items: flex-start; }
                .d-icon { color: var(--primary); opacity: 0.7; margin-top: 3px; }
                .d-text { display: flex; flex-direction: column; }
                .d-lbl { font-size: 0.7rem; font-weight: 900; color: var(--text-muted); text-transform: uppercase; }
                .d-val { font-size: 0.9rem; font-weight: 700; color: var(--text-heading); }

                .card-foot {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 1.25rem;
                    border-top: 1px dashed var(--border-light);
                }
                .meta-audit {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.7rem;
                    font-weight: 850;
                    color: var(--text-muted);
                }

                .loading-wrapper { grid-column: 1 / -1; padding: 10rem; display: flex; justify-content: center; width: 100%; }

                @media (max-width: 1200px) {
                    .stats-hero-grid { grid-template-columns: repeat(2, 1fr); }
                    .stats-hero-grid > :last-child { grid-column: span 2; }
                }

                @media (max-width: 768px) {
                    .stats-hero-grid { grid-template-columns: 1fr; }
                    .stats-hero-grid > :last-child { grid-column: span 1; }
                    .c-master-controls { flex-direction: column; align-items: stretch; }
                }
            `}</style>
        </div>
    );
};

export default GastoList;
