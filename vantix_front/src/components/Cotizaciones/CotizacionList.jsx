import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Activity,
    DollarSign,
    Calendar,
    RefreshCw,
    Tag,
    Clock,
    Users
} from 'lucide-react';
import { syncExternaService, authService, empleadoService, planService } from '../../services/api';
import PageHeader from '../Common/PageHeader';
import PremiumCard from '../Common/PremiumCard';
import LoadingSpinner from '../Common/LoadingSpinner';
import EmptyState from '../Common/EmptyState';
import Badge from '../Common/Badge';
import WeekPicker from '../Common/WeekPicker';

const CotizacionList = () => {
    const [user, setUser] = useState(null);
    const [cotizaciones, setCotizaciones] = useState([]);
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
                fetchInitialData(currentUser.id_empleado);
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
            setCotizaciones([]);
            setPlans([]);
            setSelectedPlanId('');

            // Obtenemos los planes del asesor para el selector de semanas
            const planesData = await planService.getAll(0, 50, empId);
            setPlans(planesData || []);

            // Obtenemos las cotizaciones (todas las del asesor, luego filtramos por semana)
            await fetchCotizaciones(empId);

            if (planesData && planesData.length > 0) {
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const day = today.getDay() || 7;
                const monday = new Date(today);
                monday.setDate(today.getDate() - day + 1);
                const mondayStr = monday.toISOString().split('T')[0];

                const currentPlan = planesData.find(p => p.fecha_inicio_semana.startsWith(mondayStr));

                if (currentPlan) {
                    setSelectedPlanId(currentPlan.id_plan);
                } else {
                    setSelectedPlanId(planesData[0].id_plan);
                }
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCotizaciones = async (empId) => {
        try {
            const data = await syncExternaService.getCotizaciones(empId);
            setCotizaciones(data || []);
        } catch (error) {
            console.error('Error fetching cotizaciones:', error);
            setCotizaciones([]);
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
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'S/N';
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const formatCurrency = (amount, symbolStr = 'S/') => {
        const symbol = symbolStr === '$' ? '$' : 'S/';
        return `${symbol} ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Lógica de filtrado por semana (Cliente-side)
    const getFilteredData = () => {
        if (!selectedPlanId || plans.length === 0) return [];

        const selectedPlan = plans.find(p => p.id_plan === parseInt(selectedPlanId));
        if (!selectedPlan) return [];

        const start = new Date(selectedPlan.fecha_inicio_semana);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        return cotizaciones.filter(c => {
            const itemDate = new Date(c.fecha);
            return itemDate >= start && itemDate <= end;
        });
    };

    const filteredCotizaciones = getFilteredData();

    const stats = {
        total: filteredCotizaciones.length,
        totalAmount: filteredCotizaciones.reduce((acc, curr) => acc + (curr.total_linea || 0), 0),
        uniqueClients: new Set(filteredCotizaciones.map(c => c.nombre_cliente)).size
    };

    return (
        <div className="cotizaciones-premium-view">
            {/* Background Ornaments */}
            <div className="c-bg-blob blob-1" />
            <div className="c-bg-blob blob-2" />
            <div className="c-noise-overlay" />

            <PageHeader
                title="Reporte de Cotizaciones"
                description="Visualización detallada de cotizaciones generadas en el sistema Upgrade."
                icon={FileText}
                breadcrumb={['Apps', 'Cotizaciones']}
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
                            onClick={() => fetchInitialData(selectedAdvisorId)}
                            disabled={loading}
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
                        <FileText size={24} />
                    </div>
                    <div className="stat-content">
                        <label>Cotizaciones Semanales</label>
                        <div className="value-row">
                            <span className="value">{stats.total}</span>
                            <span className="unit">REGISTROS</span>
                        </div>
                    </div>
                    <div className="stat-visual-glow" />
                </PremiumCard>

                <PremiumCard className="hero-stat-card success" hover={false}>
                    <div className="stat-icon-box green">
                        <DollarSign size={24} />
                    </div>
                    <div className="stat-content">
                        <label>Monto de la Semana</label>
                        <div className="value-row">
                            <span className="value">{formatCurrency(stats.totalAmount)}</span>
                        </div>
                    </div>
                    <div className="stat-visual-glow green" />
                </PremiumCard>

                <PremiumCard className="hero-stat-card info" hover={false}>
                    <div className="stat-icon-box blue">
                        <Users size={24} />
                    </div>
                    <div className="stat-content">
                        <label>Clientes Atendidos</label>
                        <div className="value-row">
                            <span className="value">{stats.uniqueClients}</span>
                            <span className="unit">UNICOS</span>
                        </div>
                    </div>
                    <div className="stat-visual-glow blue" />
                </PremiumCard>
            </div>

            <div className="data-layout">
                {loading ? (
                    <div className="loading-wrapper">
                        <LoadingSpinner message="Sincronizando con base de datos Upgrade..." />
                    </div>
                ) : filteredCotizaciones.length === 0 ? (
                    <EmptyState
                        icon={FileText}
                        title="Sin cotizaciones detectadas"
                        message="No se han encontrado registros para la semana seleccionada o el asesor no tiene actividad vinculada."
                    />
                ) : (
                    <motion.div
                        className="table-container-lux"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="table-responsive">
                            <table className="lux-table">
                                <thead>
                                    <tr>
                                        <th>Doc. N°</th>
                                        <th>Fecha</th>
                                        <th>Cliente</th>
                                        <th>Producto / Marca</th>
                                        <th className="text-center">Cant.</th>
                                        <th className="text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence mode="popLayout">
                                        {filteredCotizaciones.map((c, idx) => (
                                            <motion.tr
                                                key={`${c.numero_cotizacion}-${idx}`}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: idx * 0.02 }}
                                            >
                                                <td>
                                                    <div className="doc-cell">
                                                        <span className="doc-num">#{c.numero_cotizacion}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="date-cell">
                                                        <Clock size={14} className="ico-muted" />
                                                        <span>{formatDate(c.fecha)}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="client-cell">
                                                        <div className="client-avatar">
                                                            {c.nombre_cliente?.charAt(0) || 'C'}
                                                        </div>
                                                        <span className="client-name">{c.nombre_cliente}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="product-cell">
                                                        <span className="prod-name">{c.producto}</span>
                                                        <span className="prod-brand"><Tag size={10} /> {c.marca}</span>
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <Badge variant="info">{c.cantidad}</Badge>
                                                </td>
                                                <td className="text-right">
                                                    <span className="total-val">{formatCurrency(c.total_linea, c.moneda_simbolo)}</span>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </div>

            <style jsx>{`
                .cotizaciones-premium-view {
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
                .blob-1 { top: -10%; right: -5%; width: 600px; height: 600px; background: var(--primary); }
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
                    background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
                    pointer-events: none;
                }
                .stat-visual-glow.green { background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%); }
                .stat-visual-glow.blue { background: radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%); }

                /* Table Lux */
                .table-container-lux {
                    background: white;
                    border-radius: 32px;
                    border: 1px solid var(--border-subtle);
                    overflow: hidden;
                    box-shadow: 0 10px 30px -10px rgba(0,0,0,0.04);
                }
                :global(.dark) .table-container-lux { background: var(--bg-panel); border-color: var(--border-light); }

                .table-responsive { width: 100%; overflow-x: auto; }
                .lux-table { width: 100%; border-collapse: collapse; text-align: left; }
                .lux-table th {
                    padding: 1.5rem 2rem;
                    background: #f8fafc;
                    font-size: 0.75rem;
                    font-weight: 900;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    border-bottom: 1px solid var(--border-subtle);
                }
                :global(.dark) .lux-table th { background: rgba(255,255,255,0.02); }
                .lux-table td { padding: 1.5rem 2rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
                :global(.dark) .lux-table td { border-color: rgba(255,255,255,0.05); }

                .doc-num { font-family: monospace; font-weight: 950; font-size: 1rem; color: var(--primary); }
                .date-cell { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; font-weight: 700; color: var(--text-body); }
                .ico-muted { color: var(--text-muted); opacity: 0.6; }
                
                .client-cell { display: flex; align-items: center; gap: 12px; }
                .client-avatar {
                    width: 36px; height: 36px; border-radius: 12px;
                    background: #f1f5f9; color: var(--text-muted);
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 850; font-size: 0.85rem; border: 1px solid var(--border-subtle);
                }
                .client-name { font-weight: 800; color: var(--text-heading); font-size: 0.95rem; }

                .product-cell { display: flex; flex-direction: column; gap: 4px; }
                .prod-name { font-weight: 700; color: var(--text-heading); font-size: 0.9rem; line-height: 1.3; }
                .prod-brand { 
                    font-size: 0.75rem; font-weight: 850; color: #14b8a6; 
                    display: flex; align-items: center; gap: 4px; text-transform: uppercase;
                }

                .total-val { font-size: 1rem; font-weight: 950; color: var(--text-heading); }
                .text-right { text-align: right; }
                .text-center { text-align: center; }

                .loading-wrapper { padding: 10rem; display: flex; justify-content: center; width: 100%; }

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

export default CotizacionList;
