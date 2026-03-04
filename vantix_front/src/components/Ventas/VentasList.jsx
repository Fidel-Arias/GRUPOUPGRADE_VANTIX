import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DollarSign,
    Calendar,
    Users,
    ChevronRight,
    ArrowUpRight,
    FileText,
    RefreshCw,
    TrendingUp,
    Activity,
    Briefcase,
    ChevronLeft
} from 'lucide-react';
import { syncExternaService, empleadoService, authService } from '../../services/api';
import PageHeader from '../Common/PageHeader';
import PremiumCard from '../Common/PremiumCard';
import LoadingSpinner from '../Common/LoadingSpinner';
import EmptyState from '../Common/EmptyState';
import Badge from '../Common/Badge';
import WeekPicker from '../Common/WeekPicker';
import AlertModal from '../Common/AlertModal';

const VentasList = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [ventas, setVentas] = useState([]);
    const [advisors, setAdvisors] = useState([]);
    const [selectedAdvisorId, setSelectedAdvisorId] = useState('');
    const [selectedMonday, setSelectedMonday] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [alertConfig, setAlertConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    useEffect(() => {
        const currentUser = authService.getUser();
        setUser(currentUser);

        const now = new Date();
        const monday = getMonday(now);
        setSelectedMonday(monday);

        if (currentUser) {
            if (currentUser.is_admin) {
                fetchAdvisors();
            } else {
                setSelectedAdvisorId(currentUser.id_empleado);
            }
            fetchInitialData(currentUser.is_admin ? '' : currentUser.id_empleado, monday);
        }
    }, []);

    const getMonday = (d) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    };

    const fetchAdvisors = async () => {
        try {
            const data = await empleadoService.getAll();
            setAdvisors(data.filter(e => !e.is_admin) || []);
        } catch (error) {
            console.error('Error fetching advisors:', error);
        }
    };

    const fetchInitialData = async (empId, monday) => {
        if (!monday) return;

        try {
            setLoading(true);
            const fechaInicio = monday.toISOString().split('T')[0];
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            const fechaFin = sunday.toISOString().split('T')[0];

            const data = await syncExternaService.getVentas(empId || null, fechaInicio, fechaFin);
            setVentas(data || []);
            setCurrentPage(1); // Reset to first page on new data
        } catch (error) {
            console.error('Error fetching ventas:', error);
            setAlertConfig({
                isOpen: true,
                title: 'Error de Conexión',
                message: 'No se pudieron recuperar las órdenes de venta desde UpgradeDB.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAdvisorChange = (e) => {
        const val = e.target.value;
        setSelectedAdvisorId(val);
        fetchInitialData(val, selectedMonday);
    };

    const handleWeekChange = (mondayStr) => {
        const monday = new Date(mondayStr);
        setSelectedMonday(monday);
        fetchInitialData(selectedAdvisorId, monday);
    };

    const handleRefresh = () => {
        fetchInitialData(selectedAdvisorId, selectedMonday);
    };

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentVentas = ventas.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(ventas.length / itemsPerPage);

    const stats = useMemo(() => {
        const totalPEN = ventas.reduce((acc, v) => v.moneda_simbolo?.includes('S/') ? acc + parseFloat(v.total) : acc, 0);
        const totalUSD = ventas.reduce((acc, v) => v.moneda_simbolo?.includes('$') ? acc + parseFloat(v.total) : acc, 0);
        return {
            count: ventas.length,
            totalPEN,
            totalUSD,
            avgTickets: ventas.length > 0 ? (totalPEN / (ventas.filter(v => v.moneda_simbolo?.includes('S/')).length || 1)).toFixed(2) : 0
        };
    }, [ventas]);

    // Generar semanas para el picker
    const availableWeeks = useMemo(() => {
        const weeks = [];
        const now = new Date();
        const currentMonday = getMonday(now);
        for (let i = 0; i < 12; i++) {
            const m = new Date(currentMonday);
            m.setDate(currentMonday.getDate() - (i * 7));
            weeks.push({
                id_plan: m.toISOString().split('T')[0],
                fecha_inicio_semana: m.toISOString().split('T')[0],
                estado: 'Historial'
            });
        }
        return weeks;
    }, []);

    return (
        <div className="ventas-premium-view">
            <div className="v-bg-blob blob-1" />
            <div className="v-bg-blob blob-2" />
            <div className="v-noise-overlay" />

            <PageHeader
                title="Órdenes de Ventas"
                description="Reporte detallado de transacciones sincronizadas con UpgradeDB."
                icon={DollarSign}
                breadcrumb={['Métricas', 'Ventas']}
                actions={
                    <div className="header-actions">
                        <button className="sync-btn" onClick={handleRefresh} disabled={loading}>
                            <RefreshCw size={20} className={loading ? 'spin' : ''} />
                        </button>
                    </div>
                }
            />

            <div className="filter-strip glass">
                <div className="filters-left">
                    {user?.is_admin && (
                        <div className="advisor-filter">
                            <Users size={18} />
                            <select value={selectedAdvisorId} onChange={handleAdvisorChange}>
                                <option value="">Todos los Asesores</option>
                                {advisors.map(adv => (
                                    <option key={adv.id_empleado} value={adv.id_empleado}>
                                        {adv.nombre_completo}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="week-filter">
                        <WeekPicker
                            plans={availableWeeks}
                            selectedPlanId={selectedMonday?.toISOString().split('T')[0]}
                            onChange={handleWeekChange}
                        />
                    </div>
                </div>
            </div>

            <div className="v-stats-grid">
                <PremiumCard className="v-stat-card">
                    <div className="icon-box pen">
                        <DollarSign size={24} />
                    </div>
                    <div className="stat-info">
                        <label>Ventas Semanales (PEN)</label>
                        <div className="value">S/ {stats.totalPEN.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</div>
                    </div>
                </PremiumCard>

                <PremiumCard className="v-stat-card">
                    <div className="icon-box usd">
                        <DollarSign size={24} />
                    </div>
                    <div className="stat-info">
                        <label>Ventas Semanales (USD)</label>
                        <div className="value">$ {stats.totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    </div>
                </PremiumCard>

                <PremiumCard className="v-stat-card">
                    <div className="icon-box items">
                        <FileText size={24} />
                    </div>
                    <div className="stat-info">
                        <label>Total Órdenes</label>
                        <div className="value">{stats.count}</div>
                    </div>
                </PremiumCard>

                <PremiumCard className="v-stat-card">
                    <div className="icon-box efficiency">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-info">
                        <label>Ticket Promedio (PEN)</label>
                        <div className="value">S/ {parseFloat(stats.avgTickets).toLocaleString('es-PE')}</div>
                    </div>
                </PremiumCard>
            </div>

            <div className="v-table-container glass">
                {loading ? (
                    <div className="loading-state">
                        <LoadingSpinner message="Extrayendo órdenes desde UpgradeDB..." />
                    </div>
                ) : ventas.length === 0 ? (
                    <EmptyState
                        icon={Briefcase}
                        title="No hay ventas registradas"
                        message="No se encontraron órdenes de venta para los filtros seleccionados."
                    />
                ) : (
                    <>
                        <table className="v-elite-table">
                            <thead>
                                <tr>
                                    <th>FECHA</th>
                                    <th>CLIENTE / PRODUCTO</th>
                                    <th>ORDEN</th>
                                    <th>ASESOR</th>
                                    <th className="text-right">MONTO TOTAL</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentVentas.map((v, i) => (
                                    <motion.tr
                                        key={v.numero_orden || i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <td>
                                            <div className="date-cell">
                                                <Calendar size={14} />
                                                <span>{new Date(v.fecha + 'T12:00:00').toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="client-cell">
                                                <span className="name">{v.cliente_nombre}</span>
                                                <span className="product-info">{v.producto}</span>
                                            </div>
                                        </td>
                                        <td><code className="doc-num">#{v.numero_orden}</code></td>
                                        <td>
                                            <div className="advisor-cell">
                                                <div className="avatar">{v.vendedor_nombre?.charAt(0)}</div>
                                                <span>{v.vendedor_nombre}</span>
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <span className={`amount-badge ${v.moneda_simbolo?.includes('$') ? 'usd' : ''}`}>
                                                {v.moneda_simbolo} {parseFloat(v.total).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <button className="btn-detail" title="Ver detalles">
                                                <ArrowUpRight size={16} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination Controls */}
                        <div className="v-pagination">
                            <span className="pagination-info">
                                Mostrando <strong>{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, ventas.length)}</strong> de <strong>{ventas.length}</strong>
                            </span>
                            <div className="pagination-buttons">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-btn"
                                >
                                    <ChevronLeft size={18} />
                                </button>

                                {[...Array(totalPages)].map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentPage(idx + 1)}
                                        className={`p-btn num-btn ${currentPage === idx + 1 ? 'active' : ''}`}
                                    >
                                        {idx + 1}
                                    </button>
                                )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-btn"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
            />

            <style jsx>{`
                .ventas-premium-view { 
                    display: flex; flex-direction: column; gap: 2rem; 
                    position: relative; min-height: 100vh; padding-bottom: 4rem;
                }

                .v-bg-blob { position: fixed; z-index: -2; filter: blur(120px); opacity: 0.1; border-radius: 50%; }
                .blob-1 { top: -10%; right: -5%; width: 600px; height: 600px; background: #eab308; }
                .blob-2 { bottom: -5%; left: -5%; width: 500px; height: 500px; background: #6366f1; }
                .v-noise-overlay { position: fixed; inset: 0; z-index: -1; opacity: 0.02; pointer-events: none; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E"); }

                .header-actions { display: flex; align-items: center; gap: 12px; }

                .sync-btn {
                    width: 48px; height: 48px; border-radius: 16px; border: none;
                    background: var(--primary-glow); color: var(--primary);
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: all 0.3s; border: 1px solid var(--border-subtle);
                }
                .sync-btn:hover:not(:disabled) { background: var(--primary); color: white; transform: rotate(180deg); }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                .filter-strip {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 0.75rem 1.5rem; border-radius: 20px;
                    background: rgba(255, 255, 255, 0.6) !important;
                    backdrop-filter: blur(10px);
                }
                :global(.dark) .filter-strip { background: rgba(30, 30, 30, 0.4) !important; border: 1px solid rgba(255,255,255,0.05); }
                
                .filters-left { display: flex; align-items: center; gap: 12px; }
                .advisor-filter {
                    display: flex; align-items: center; gap: 10px;
                    background: white; height: 44px; padding: 0 1rem;
                    border-radius: 12px; border: 1px solid var(--border-light);
                    color: var(--text-muted);
                }
                :global(.dark) .advisor-filter { background: rgba(0,0,0,0.2); }
                .advisor-filter select { border: none; background: transparent; outline: none; font-size: 0.85rem; font-weight: 700; color: var(--text-heading); cursor: pointer; }
                :global(.dark) .advisor-filter select { color: white; }

                .v-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
                
                :global(.v-stat-card) {
                    padding: 1.5rem !important; display: flex; align-items: center; gap: 1rem;
                    background: rgba(255, 255, 255, 0.4) !important;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.5);
                }
                :global(.dark) :global(.v-stat-card) { background: rgba(30, 30, 30, 0.4) !important; border-color: rgba(255,255,255,0.05); }
                
                .icon-box { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
                .icon-box.pen { background: #fefce8; color: #eab308; }
                .icon-box.usd { background: #ecfdf5; color: #10b981; }
                .icon-box.items { background: #eef2ff; color: #6366f1; }
                .icon-box.efficiency { background: #fff1f2; color: #f43f5e; }
                
                .stat-info label { font-size: 0.7rem; font-weight: 850; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
                .stat-info .value { font-size: 1.4rem; font-weight: 900; color: var(--text-heading); letter-spacing: -0.02em; }
                :global(.dark) .stat-info .value { color: white; }

                .v-table-container { 
                    padding: 0; min-height: 400px; 
                    background: rgba(255, 255, 255, 0.4) !important;
                    backdrop-filter: blur(10px);
                    border-radius: 24px; overflow: hidden;
                    display: flex; flex-direction: column;
                }
                :global(.dark) .v-table-container { background: rgba(30, 30, 30, 0.4) !important; border: 1px solid rgba(255,255,255,0.05); }

                .v-elite-table { width: 100%; border-collapse: collapse; flex: 1; }
                .v-elite-table th { padding: 1.25rem 1.5rem; text-align: left; font-size: 0.75rem; font-weight: 900; color: var(--text-muted); text-transform: uppercase; background: rgba(0,0,0,0.02); }
                .v-elite-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(0,0,0,0.04); }
                :global(.dark) .v-elite-table td { border-bottom: 1px solid rgba(255,255,255,0.03); }
                
                .date-cell { display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--text-heading); }
                .client-cell { display: flex; flex-direction: column; gap: 2px; }
                .client-cell .name { font-weight: 800; color: var(--text-heading); font-size: 0.9rem; }
                .client-cell .product-info { font-size: 0.7rem; color: var(--text-muted); font-weight: 600; font-style: italic; }
                
                .doc-num { background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 700; color: #475569; }
                :global(.dark) .doc-num { background: rgba(255,255,255,0.05); color: #cbd5e1; }
                
                .advisor-cell { display: flex; align-items: center; gap: 10px; font-weight: 700; color: var(--text-heading); }
                .advisor-cell .avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--primary-glow); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; border: 1px solid var(--border-subtle); }
                
                .amount-badge { 
                    padding: 6px 14px; border-radius: 12px; font-size: 0.95rem; font-weight: 900;
                    background: #f0fdf4; color: #16a34a; white-space: nowrap;
                }
                .amount-badge.usd { background: #ecfdf5; color: #0891b2; }

                .btn-detail { 
                    width: 36px; height: 36px; border-radius: 10px; border: none;
                    background: #f8fafc; color: var(--text-muted); display: flex;
                    align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;
                }
                .btn-detail:hover { background: var(--primary); color: white; }

                .v-pagination { 
                    background: rgba(0,0,0,0.01); padding: 1rem 2rem; 
                    display: flex; justify-content: space-between; align-items: center;
                    border-top: 1px solid rgba(0,0,0,0.04);
                }
                :global(.dark) .v-pagination { border-color: rgba(255,255,255,0.03); }
                .pagination-info { font-size: 0.85rem; color: var(--text-muted); }
                .pagination-buttons { display: flex; gap: 6px; }
                .p-btn { 
                    width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--border-light);
                    background: white; color: var(--text-body); display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: all 0.2s;
                }
                :global(.dark) .p-btn { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.05); color: #cbd5e1; }
                .p-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
                .p-btn:disabled { opacity: 0.3; cursor: not-allowed; }
                .p-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
                .num-btn { font-size: 0.85rem; font-weight: 700; }

                .text-right { text-align: right; }
                .loading-state { height: 400px; display: flex; align-items: center; justify-content: center; }

                @media (max-width: 1200px) {
                    .v-stats-grid { grid-template-columns: repeat(2, 1fr); }
                }
                @media (max-width: 768px) {
                    .v-stats-grid { grid-template-columns: 1fr; }
                    .filter-strip { flex-direction: column; align-items: stretch; gap: 1rem; }
                    .filters-left { flex-direction: column; align-items: stretch; }
                }
            `}</style>
        </div>
    );
};

export default VentasList;
