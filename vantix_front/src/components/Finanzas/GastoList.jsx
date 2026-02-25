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
    Clock
} from 'lucide-react';
import { finanzasService, planService } from '../../services/api';

const GastoList = () => {
    const [gastos, setGastos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [idPlanFilter, setIdPlanFilter] = useState('');
    const [planes, setPlanes] = useState([]);
    const [showModal, setShowModal] = useState(false);
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

    const handleDelete = async (id) => {
        if (confirm('¿Estás seguro de eliminar este registro?')) {
            try {
                await finanzasService.delete(id);
                fetchInitialData();
            } catch (error) {
                alert('Error al eliminar: ' + error.message);
            }
        }
    };

    const totalGastado = gastos.reduce((acc, curr) => acc + parseFloat(curr.monto_gastado), 0);
    const filteredGastos = gastos.filter(g =>
        g.institucion_visitada?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.lugar_destino?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="finanzas-container">
            {/* Header Section */}
            <div className="finanzas-header">
                <div className="header-info">
                    <h1>Gestión de Gastos</h1>
                    <p>Seguimiento detallado de movilidad y reembolsos de la fuerza de ventas.</p>
                </div>
                <div className="header-stats">
                    <div className="stat-card-mini">
                        <span className="label">Total Acumulado</span>
                        <span className="value">S/ {totalGastado.toFixed(2)}</span>
                        <div className="trend positive">
                            <TrendingUp size={14} />
                            <span>Presupuesto OK</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar Area */}
            <div className="finanzas-toolbar">
                <div className="search-box">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por institución o destino..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="toolbar-actions">
                    <button className="btn-filter hide-tablet">
                        <Filter size={18} />
                        <span>Filtros Avanzados</span>
                    </button>
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={20} />
                        <span className="btn-text">Nuevo Registro</span>
                    </button>
                </div>
            </div>

            {/* Expenses List */}
            <div className="gastos-grid">
                <AnimatePresence>
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Cargando registros financieros...</p>
                        </div>
                    ) : filteredGastos.length > 0 ? (
                        filteredGastos.map((g, i) => (
                            <motion.div
                                key={g.id_gasto}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="gasto-card-premium"
                            >
                                <div className="card-top">
                                    <div className="date-badge">
                                        <Calendar size={14} />
                                        <span>{new Date(g.fecha_gasto).toLocaleDateString()}</span>
                                    </div>
                                    <div className="amount-badge">
                                        S/ {parseFloat(g.monto_gastado).toFixed(2)}
                                    </div>
                                </div>

                                <div className="card-route">
                                    <div className="route-point">
                                        <MapPin size={16} className="text-secondary" />
                                        <div>
                                            <span className="point-label">Origen</span>
                                            <span className="point-name">{g.lugar_origen || 'No especificado'}</span>
                                        </div>
                                    </div>
                                    <div className="route-arrow">
                                        <ArrowRight size={18} />
                                    </div>
                                    <div className="route-point">
                                        <MapPin size={16} className="text-primary" />
                                        <div>
                                            <span className="point-label">Destino</span>
                                            <span className="point-name">{g.lugar_destino || 'No especificado'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-details">
                                    <div className="detail-item">
                                        <Building2 size={16} />
                                        <p><strong>Institución:</strong> {g.institucion_visitada}</p>
                                    </div>
                                    <div className="detail-item">
                                        <FileText size={16} />
                                        <p><strong>Motivo:</strong> {g.motivo_visita}</p>
                                    </div>
                                </div>

                                <div className="card-footer">
                                    <div className="plan-id">
                                        <Briefcase size={14} />
                                        <span>Plan #{g.id_plan}</span>
                                    </div>
                                    <div className="actions">
                                        <button className="btn-icon delete" onClick={() => handleDelete(g.id_gasto)}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <AlertCircle size={48} />
                            <h3>No se encontraron registros</h3>
                            <p>Ajusta tu búsqueda o registra un nuevo gasto para comenzar.</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="modal-overlay">
                        <motion.div
                            className="modal-container-premium"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <div className="modal-header">
                                <h2>Registrar Movilidad</h2>
                                <button className="btn-close" onClick={() => setShowModal(false)}>&times;</button>
                            </div>
                            <form onSubmit={handleCreateGasto} className="modal-form">
                                <div className="form-grid">
                                    <div className="form-group full">
                                        <label>Asociar a Plan Semanal</label>
                                        <select
                                            required
                                            value={newGasto.id_plan}
                                            onChange={(e) => setNewGasto({ ...newGasto, id_plan: e.target.value })}
                                        >
                                            <option value="">Selecciona un plan activo</option>
                                            {planes.map(p => (
                                                <option key={p.id_plan} value={p.id_plan}>
                                                    Plan Semanal #{p.id_plan} - {new Date(p.fecha_inicio).toLocaleDateString()}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Fecha</label>
                                        <input
                                            type="date"
                                            required
                                            value={newGasto.fecha_gasto}
                                            onChange={(e) => setNewGasto({ ...newGasto, fecha_gasto: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Monto (S/)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            placeholder="0.00"
                                            value={newGasto.monto_gastado}
                                            onChange={(e) => setNewGasto({ ...newGasto, monto_gastado: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Lugar Origen</label>
                                        <input
                                            type="text"
                                            placeholder="Ej. Oficina Central"
                                            value={newGasto.lugar_origen}
                                            onChange={(e) => setNewGasto({ ...newGasto, lugar_origen: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Lugar Destino</label>
                                        <input
                                            type="text"
                                            placeholder="Ej. Clínica San Pablo"
                                            value={newGasto.lugar_destino}
                                            onChange={(e) => setNewGasto({ ...newGasto, lugar_destino: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group full">
                                        <label>Institución Visitada</label>
                                        <input
                                            type="text"
                                            required
                                            value={newGasto.institucion_visitada}
                                            onChange={(e) => setNewGasto({ ...newGasto, institucion_visitada: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group full">
                                        <label>Motivo de la Visita</label>
                                        <textarea
                                            rows="2"
                                            value={newGasto.motivo_visita}
                                            onChange={(e) => setNewGasto({ ...newGasto, motivo_visita: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                    <button type="submit" className="btn-primary">Guardar Registro</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .finanzas-container {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                    padding-bottom: 2rem;
                }

                .finanzas-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }

                .header-info h1 {
                    font-size: 2.25rem;
                    font-weight: 800;
                    letter-spacing: -0.04em;
                    color: #0f172a;
                    margin: 0;
                }

                .header-info p {
                    color: #64748b;
                    margin-top: 0.5rem;
                    font-size: 1.1rem;
                }

                .stat-card-mini {
                    background: #1e293b;
                    padding: 1.5rem 2rem;
                    border-radius: 20px;
                    color: white;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    box-shadow: 0 10px 25px -5px rgba(30, 41, 59, 0.4);
                }

                .stat-card-mini .label {
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .stat-card-mini .value {
                    font-size: 1.75rem;
                    font-weight: 800;
                }

                .trend {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.75rem;
                    font-weight: 700;
                }

                .trend.positive { color: #4ade80; }

                .finanzas-toolbar {
                    display: flex;
                    justify-content: space-between;
                    gap: 1.5rem;
                    background: white;
                    padding: 1rem;
                    border-radius: 20px;
                    border: 1px solid #f1f5f9;
                }

                .search-box {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: #f8fafc;
                    padding: 0 1.25rem;
                    border-radius: 14px;
                    border: 1px solid #e2e8f0;
                    color: #64748b;
                }

                .search-box input {
                    width: 100%;
                    background: transparent;
                    border: none;
                    padding: 12px 0;
                    outline: none;
                    font-size: 0.95rem;
                    color: #1e293b;
                }

                .toolbar-actions {
                    display: flex;
                    gap: 10px;
                }

                .btn-filter {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: white;
                    color: #475569;
                    border: 1px solid #e2e8f0;
                    padding: 0 20px;
                    border-radius: 14px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-filter:hover { background: #f8fafc; }

                .btn-primary {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: #0ea5e9;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 14px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
                }

                .btn-primary:hover { 
                    transform: translateY(-2px);
                    box-shadow: 0 8px 16px rgba(14, 165, 233, 0.4);
                }

                .gastos-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
                    gap: 1.5rem;
                }

                .gasto-card-premium {
                    background: white;
                    border-radius: 24px;
                    padding: 1.5rem;
                    border: 1px solid #f1f5f9;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
                    transition: all 0.3s ease;
                }

                .gasto-card-premium:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05);
                    border-color: #e2e8f0;
                }

                .card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .date-badge {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: #f1f5f9;
                    color: #64748b;
                    padding: 6px 14px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 700;
                }

                .amount-badge {
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: #0f172a;
                }

                .card-route {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1.25rem;
                    background: #f8fafc;
                    border-radius: 20px;
                    position: relative;
                }

                .route-point {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                }

                .point-label {
                    display: block;
                    font-size: 0.65rem;
                    color: #94a3b8;
                    text-transform: uppercase;
                    font-weight: 800;
                    letter-spacing: 0.05em;
                }

                .point-name {
                    display: block;
                    font-size: 0.9rem;
                    font-weight: 700;
                    color: #1e293b;
                }

                .route-arrow {
                    padding: 0 1rem;
                    color: #cbd5e1;
                }

                .card-details {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .detail-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    color: #64748b;
                    font-size: 0.9rem;
                }

                .detail-item strong { color: #1e293b; }

                .card-footer {
                    margin-top: auto;
                    padding-top: 1rem;
                    border-top: 1px solid #f1f5f9;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .plan-id {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #94a3b8;
                    font-size: 0.8rem;
                    font-weight: 600;
                }

                .actions {
                    display: flex;
                    gap: 8px;
                }

                .btn-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-icon.delete {
                    background: #fef2f2;
                    color: #ef4444;
                }

                .btn-icon.delete:hover {
                    background: #ef4444;
                    color: white;
                }

                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.5);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    padding: 1.5rem;
                }

                .modal-container-premium {
                    background: white;
                    width: 100%;
                    max-width: 650px;
                    border-radius: 28px;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
                }

                .modal-header {
                    padding: 2rem;
                    background: #f8fafc;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .modal-header h2 {
                    margin: 0;
                    font-size: 1.5rem;
                    font-weight: 800;
                }

                .btn-close {
                    background: none;
                    border: none;
                    font-size: 2rem;
                    color: #94a3b8;
                    cursor: pointer;
                }

                .modal-form {
                    padding: 2rem;
                }

                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                }

                .form-group.full {
                    grid-column: span 2;
                }

                .form-group label {
                    display: block;
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: #475569;
                    margin-bottom: 8px;
                }

                .form-group input, 
                .form-group select, 
                .form-group textarea {
                    width: 100%;
                    padding: 12px 1rem;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    background: #f8fafc;
                    font-size: 0.95rem;
                    outline: none;
                    transition: all 0.2s;
                }

                .form-group input:focus, 
                .form-group select:focus {
                    border-color: #0ea5e9;
                    background: white;
                    box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1);
                }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    margin-top: 2rem;
                }

                .btn-secondary {
                    padding: 12px 24px;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    background: white;
                    font-weight: 700;
                    cursor: pointer;
                }

                .loading-state {
                    grid-column: 1 / -1;
                    padding: 5rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                    color: #64748b;
                }

                .empty-state {
                    grid-column: 1 / -1;
                    padding: 5rem;
                    text-align: center;
                    color: #94a3b8;
                }

                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f1f5f9;
                    border-top-color: #0ea5e9;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 1024px) {
                    .finanzas-header {
                        flex-direction: column;
                        gap: 1.5rem;
                    }
                    .header-stats {
                        width: 100%;
                    }
                    .stat-card-mini {
                        padding: 1.25rem;
                    }
                    .finanzas-toolbar {
                        flex-direction: column;
                        gap: 1rem;
                    }
                    .toolbar-actions {
                        width: 100%;
                    }
                    .toolbar-actions button {
                        flex: 1;
                    }
                }

                @media (max-width: 768px) {
                    .gastos-grid { grid-template-columns: 1fr; }
                    .form-grid { grid-template-columns: 1fr; }
                    .form-group.full { grid-column: auto; }
                    .hide-tablet { display: none; }
                }

                @media (max-width: 640px) {
                    .header-info h1 { font-size: 1.8rem; }
                    .header-info p { font-size: 1rem; }
                    .btn-text { display: none; }
                    .btn-primary {
                        position: fixed;
                        bottom: 1.5rem;
                        right: 1.5rem;
                        width: 56px;
                        height: 56px;
                        border-radius: 50%;
                        padding: 0;
                        justify-content: center;
                        z-index: 100;
                        box-shadow: 0 10px 25px rgba(14, 165, 233, 0.4);
                    }
                    .gasto-card-premium { padding: 1.25rem; }
                    .card-route { padding: 1rem; flex-direction: column; gap: 1rem; align-items: flex-start; }
                    .route-arrow { transform: rotate(90deg); align-self: center; padding: 0.5rem 0; }
                    .modal-container-premium { border-radius: 0; height: 100%; max-width: 100%; }
                    .modal-form { padding: 1.5rem; }
                }
            `}</style>
        </div>
    );
};

export default GastoList;
