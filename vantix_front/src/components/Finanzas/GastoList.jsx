import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DollarSign,
    Plus,
    Search,
    Calendar,
    MapPin,
    Briefcase,
    Trash2,
    Edit3,
    ArrowRight,
    TrendingUp,
    Filter,
    FileText,
    ChevronDown,
    Building2,
    AlertCircle,
    CheckCircle2,
    Clock,
    Wallet
} from 'lucide-react';
import { finanzasService, planService } from '../../services/api';
import PageHeader from '../Common/PageHeader';
import PremiumCard from '../Common/PremiumCard';
import Badge from '../Common/Badge';
import SearchInput from '../Common/SearchInput';
import LoadingSpinner from '../Common/LoadingSpinner';
import EmptyState from '../Common/EmptyState';
import ConfirmModal from '../Common/ConfirmModal';

const GastoList = () => {
    const [gastos, setGastos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [idPlanFilter, setIdPlanFilter] = useState('');
    const [planes, setPlanes] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [newGasto, setNewGasto] = useState({
        id_plan: '',
        fecha_gasto: new Date().toISOString().split('T')[0],
        lugar_origen: '',
        lugar_destino: '',
        institucion_visitada: '',
        motivo_visita: '',
        monto_gastado: 0
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [gastosData, planesData] = await Promise.all([
                finanzasService.getAll(),
                planService.getAll()
            ]);
            setGastos(gastosData);
            setPlanes(planesData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGasto = async (e) => {
        e.preventDefault();
        try {
            await finanzasService.create({
                ...newGasto,
                monto_gastado: parseFloat(newGasto.monto_gastado)
            });
            setShowModal(false);
            setNewGasto({
                id_plan: '',
                fecha_gasto: new Date().toISOString().split('T')[0],
                lugar_origen: '',
                lugar_destino: '',
                institucion_visitada: '',
                motivo_visita: '',
                monto_gastado: 0
            });
            fetchInitialData();
        } catch (error) {
            alert('Error al registrar gasto: ' + error.message);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await finanzasService.delete(deleteConfirm);
            fetchInitialData();
            setDeleteConfirm(null);
        } catch (error) {
            alert('Error al eliminar: ' + error.message);
        }
    };

    const totalGastado = gastos.reduce((acc, curr) => acc + parseFloat(curr.monto_gastado), 0);
    const filteredGastos = gastos.filter(g =>
        g.institucion_visitada?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.lugar_destino?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="finanzas-container">
            <PageHeader
                title="Gestión de Gastos"
                description="Seguimiento detallado de movilidad y reembolsos."
                icon={Wallet}
                breadcrumb={['Apps', 'Finanzas']}
                actions={
                    <div className="header-actions-group">
                        <PremiumCard className="total-badge-card" hover={false}>
                            <div className="total-content">
                                <span className="label">Total Acumulado</span>
                                <span className="value">S/ {totalGastado.toFixed(2)}</span>
                            </div>
                            <div className="trend-icon">
                                <TrendingUp size={20} />
                            </div>
                        </PremiumCard>
                        <button className="btn-primary" onClick={() => setShowModal(true)}>
                            <Plus size={20} />
                            <span className="btn-text">Nuevo Registro</span>
                        </button>
                    </div>
                }
            />

            <PremiumCard className="toolbar-card" hover={false}>
                <SearchInput
                    placeholder="Buscar por institución o destino..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </PremiumCard>

            <div className="gastos-grid">
                {loading ? (
                    <div className="loading-wrapper">
                        <LoadingSpinner message="Obteniendo registros financieros..." />
                    </div>
                ) : filteredGastos.length === 0 ? (
                    <EmptyState
                        icon={DollarSign}
                        title="Sin gastos registrados"
                        message="No se encontraron registros para los criterios de búsqueda."
                    />
                ) : (
                    <AnimatePresence>
                        {filteredGastos.map((g, i) => (
                            <PremiumCard key={g.id_gasto} className="gasto-card-elite">
                                <div className="card-top">
                                    <div className="date-info">
                                        <Calendar size={14} />
                                        <span>{new Date(g.fecha_gasto).toLocaleDateString()}</span>
                                    </div>
                                    <Badge variant="success">
                                        S/ {parseFloat(g.monto_gastado).toFixed(2)}
                                    </Badge>
                                </div>

                                <div className="card-route-elite">
                                    <div className="point origin">
                                        <div className="dot"></div>
                                        <div className="text">
                                            <span className="lbl">Origen</span>
                                            <span className="val">{g.lugar_origen || 'S/I'}</span>
                                        </div>
                                    </div>
                                    <div className="connector">
                                        <ArrowRight size={14} />
                                    </div>
                                    <div className="point destination">
                                        <div className="dot"></div>
                                        <div className="text">
                                            <span className="lbl">Destino</span>
                                            <span className="val">{g.lugar_destino || 'S/I'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-details-elite">
                                    <div className="info-row">
                                        <Building2 size={16} />
                                        <div className="info-text">
                                            <span className="lbl">Institución</span>
                                            <span className="val">{g.institucion_visitada}</span>
                                        </div>
                                    </div>
                                    <div className="info-row">
                                        <FileText size={16} />
                                        <div className="info-text">
                                            <span className="lbl">Motivo</span>
                                            <span className="val">{g.motivo_visita}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-footer-elite">
                                    <div className="meta">
                                        <Clock size={12} />
                                        <span>Registrado por Operaciones</span>
                                    </div>
                                    <div className="actions">
                                        <button className="del-btn" onClick={() => setDeleteConfirm(g.id_gasto)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </PremiumCard>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* Modal para nuevo gasto */}
            <AnimatePresence>
                {showModal && (
                    <div className="modal-overlay-elite">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="modal-content-elite"
                        >
                            <div className="modal-header">
                                <h2>Registrar Nuevo Gasto</h2>
                                <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
                            </div>
                            <form onSubmit={handleCreateGasto} className="gasto-form">
                                <div className="form-grid">
                                    <div className="form-group full">
                                        <label>Plan Semanal Asociado</label>
                                        <select
                                            value={newGasto.id_plan}
                                            onChange={(e) => setNewGasto({ ...newGasto, id_plan: e.target.value })}
                                            required
                                        >
                                            <option value="">Seleccione un plan...</option>
                                            {planes.map(p => (
                                                <option key={p.id_plan} value={p.id_plan}>
                                                    Plan del {new Date(p.fecha_inicio).toLocaleDateString()}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Fecha</label>
                                        <input
                                            type="date"
                                            value={newGasto.fecha_gasto}
                                            onChange={(e) => setNewGasto({ ...newGasto, fecha_gasto: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Monto (S/)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={newGasto.monto_gastado}
                                            onChange={(e) => setNewGasto({ ...newGasto, monto_gastado: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Lugar Origen</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Oficina Central"
                                            value={newGasto.lugar_origen}
                                            onChange={(e) => setNewGasto({ ...newGasto, lugar_origen: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Lugar Destino</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Clínica San Borja"
                                            value={newGasto.lugar_destino}
                                            onChange={(e) => setNewGasto({ ...newGasto, lugar_destino: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Institución Visitada</label>
                                        <input
                                            type="text"
                                            value={newGasto.institucion_visitada}
                                            onChange={(e) => setNewGasto({ ...newGasto, institucion_visitada: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Motivo de la Visita</label>
                                        <input
                                            type="text"
                                            value={newGasto.motivo_visita}
                                            onChange={(e) => setNewGasto({ ...newGasto, motivo_visita: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                                    <button type="submit" className="btn-submit">Guardar Registro</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmModal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="¿Eliminar gasto?"
                message="Esta acción no se puede deshacer y afectará los reportes financieros."
            />

            <style jsx>{`
                .finanzas-container { display: flex; flex-direction: column; gap: 1.5rem; }

                .header-actions-group { display: flex; align-items: center; gap: 15px; }

                :global(.total-badge-card) { 
                    padding: 0.5rem 1.25rem !important; 
                    display: flex !important; 
                    align-items: center !important; 
                    gap: 15px !important;
                    background: var(--primary-glow) !important;
                    border-color: var(--primary) !important;
                }
                .total-content { display: flex; flex-direction: column; }
                .total-content .label { font-size: 0.65rem; font-weight: 800; color: var(--primary); text-transform: uppercase; }
                .total-content .value { font-size: 1.1rem; font-weight: 800; color: var(--text-heading); }
                .trend-icon { color: var(--primary); opacity: 0.8; }

                .btn-primary {
                    background: var(--bg-sidebar); color: white; border: none; padding: 0.8rem 1.5rem;
                    border-radius: 12px; font-weight: 700; display: flex; align-items: center; gap: 10px;
                    cursor: pointer; transition: all 0.2s; box-shadow: var(--shadow-md);
                }
                .btn-primary:hover { opacity: 0.9; transform: translateY(-2px); }

                .toolbar-card { padding: 0.75rem 1.25rem !important; }

                .gastos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.5rem; }

                :global(.gasto-card-elite) { padding: 1.5rem !important; display: flex; flex-direction: column; gap: 1.25rem; }
                
                .card-top { display: flex; justify-content: space-between; align-items: center; }
                .date-info { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }

                .card-route-elite {
                    display: flex; align-items: center; gap: 10px; padding: 12px;
                    background: var(--bg-app); border-radius: 12px; border: 1px solid var(--border-subtle);
                }
                .point { flex: 1; display: flex; gap: 10px; align-items: center; }
                .point .dot { width: 8px; height: 8px; border-radius: 50%; }
                .origin .dot { background: #6366f1; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
                .destination .dot { background: var(--primary); box-shadow: 0 0 0 4px var(--primary-glow); }
                .point .text { display: flex; flex-direction: column; }
                .point .lbl { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
                .point .val { font-size: 0.85rem; font-weight: 700; color: var(--text-heading); }
                .connector { color: var(--text-muted); opacity: 0.5; }

                .card-details-elite { display: flex; flex-direction: column; gap: 12px; }
                .info-row { display: flex; gap: 12px; align-items: flex-start; }
                .info-row :global(svg) { color: var(--primary); opacity: 0.8; margin-top: 2px; }
                .info-text { display: flex; flex-direction: column; }
                .info-text .lbl { font-size: 0.7rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
                .info-text .val { font-size: 0.9rem; font-weight: 700; color: var(--text-heading); }

                .card-footer-elite {
                    display: flex; justify-content: space-between; align-items: center;
                    padding-top: 1.25rem; border-top: 1px solid var(--border-light);
                }
                .card-footer-elite .meta { display: flex; align-items: center; gap: 6px; font-size: 0.7rem; color: var(--text-muted); font-weight: 600; }
                .del-btn {
                    width: 32px; height: 32px; border-radius: 8px; border: none; background: #fff1f2;
                    color: #ef4444; display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: 0.2s;
                }
                .del-btn:hover { background: #fee2e2; }

                .loading-wrapper { grid-column: 1 / -1; padding: 5rem; display: flex; justify-content: center; }

                /* Modal Styles */
                .modal-overlay-elite {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
                    display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;
                }
                .modal-content-elite {
                    background: white; width: 100%; max-width: 600px; border-radius: 20px;
                    overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
                }
                :global(.dark) .modal-content-elite { background: var(--bg-panel); }
                .modal-header { padding: 1.5rem; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center; }
                .modal-header h2 { font-size: 1.25rem; font-weight: 800; color: var(--text-heading); margin: 0; }
                .close-btn { background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer; }
                
                .gasto-form { padding: 1.5rem; }
                .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
                .form-group.full { grid-column: span 2; }
                .form-group label { display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; }
                .form-group input, .form-group select {
                    width: 100%; padding: 10px 15px; border-radius: 10px; border: 1px solid var(--border-subtle);
                    background: var(--bg-app); color: var(--text-heading); font-weight: 600;
                }
                .form-actions { margin-top: 2rem; display: flex; justify-content: flex-end; gap: 12px; }
                .btn-cancel { padding: 10px 20px; border-radius: 10px; border: 1px solid var(--border-subtle); background: white; font-weight: 700; cursor: pointer; }
                .btn-submit { padding: 10px 25px; border-radius: 10px; border: none; background: var(--bg-sidebar); color: white; font-weight: 700; cursor: pointer; }

                @media (max-width: 640px) {
                    .form-grid { grid-template-columns: 1fr; }
                    .form-group.full { grid-column: span 1; }
                    .header-actions-group { flex-direction: column; align-items: stretch; }
                    .btn-text { display: none; }
                }
            `}</style>
        </div>
    );
};

export default GastoList;
