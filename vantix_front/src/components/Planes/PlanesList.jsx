import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { planService, empleadoService } from '../../services/api';
import ClienteModal from '../Cartera/ClienteModal';
import PlanWizard from './PlanWizard';
import {
    Calendar,
    Plus,
    Search,
    Filter,
    ChevronRight,
    Clock,
    User,
    FileText,
    CheckCircle2,
    Clock3,
    AlertCircle,
    MoreVertical,
    Trash2,
    ExternalLink
} from 'lucide-react';

const PlanesList = () => {
    const [planes, setPlanes] = useState([]);
    const [empleados, setEmpleados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterEmpleado, setFilterEmpleado] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [planesData, empleadosData] = await Promise.all([
                planService.getAll(),
                empleadoService.getAll()
            ]);
            setPlanes(planesData);
            setEmpleados(empleadosData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'APROBADO': return { bg: '#ecfdf5', color: '#059669', icon: <CheckCircle2 size={14} /> };
            case 'BORRADOR': return { bg: '#f1f5f9', color: '#64748b', icon: <Clock3 size={14} /> };
            case 'CERRADO': return { bg: '#eff6ff', color: '#2563eb', icon: <FileText size={14} /> };
            case 'RECHAZADO': return { bg: '#fef2f2', color: '#dc2626', icon: <AlertCircle size={14} /> };
            default: return { bg: '#f1f5f9', color: '#64748b', icon: <Clock3 size={14} /> };
        }
    };

    const filteredPlanes = planes.filter(p => {
        const empleado = empleados.find(e => e.id_empleado === p.id_empleado);
        const nombreEmpleado = empleado?.nombre_completo || '';
        const matchesSearch = nombreEmpleado.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEmpleado = filterEmpleado === '' || p.id_empleado === parseInt(filterEmpleado);
        return matchesSearch && matchesEmpleado;
    });

    return (
        <div className="planes-container">
            <div className="section-header">
                <div className="title-group">
                    <h2>Planes Semanales</h2>
                    <p>Gestión de agendas y hojas de ruta de los asesores de venta.</p>
                </div>
                <button className="btn-primary" onClick={() => setIsWizardOpen(true)}>
                    <Plus size={20} />
                    <span>Nuevo Plan Semanal</span>
                </button>
            </div>

            <div className="filters-card card-premium">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por asesor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <Filter size={18} className="filter-icon" />
                    <select
                        value={filterEmpleado}
                        onChange={(e) => setFilterEmpleado(e.target.value)}
                    >
                        <option value="">Todos los asesores</option>
                        {empleados.map(e => (
                            <option key={e.id_empleado} value={e.id_empleado}>
                                {e.nombre_completo}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="planes-grid">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="plan-skeleton card-premium"></div>
                    ))
                ) : (
                    <AnimatePresence mode="popLayout">
                        {filteredPlanes.length > 0 ? (
                            filteredPlanes.map((plan) => {
                                const style = getStatusStyle(plan.estado);
                                const empleado = empleados.find(e => e.id_empleado === plan.id_empleado);

                                return (
                                    <motion.div
                                        key={plan.id_plan}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="plan-card card-premium"
                                    >
                                        <div className="plan-card-header">
                                            <div className="user-info">
                                                <div className="user-avatar">
                                                    <User size={18} />
                                                </div>
                                                <div className="user-text">
                                                    <span className="user-name">{empleado?.nombre_completo || 'Usuario'}</span>
                                                    <span className="user-role">{empleado?.cargo || 'Asesor'}</span>
                                                </div>
                                            </div>
                                            <div className="status-badge" style={{ backgroundColor: style.bg, color: style.color }}>
                                                {style.icon}
                                                <span>{plan.estado}</span>
                                            </div>
                                        </div>

                                        <div className="plan-card-body">
                                            <div className="date-info">
                                                <Calendar size={16} />
                                                <span>{new Date(plan.fecha_inicio_semana).toLocaleDateString()} - {new Date(plan.fecha_fin_semana).toLocaleDateString()}</span>
                                            </div>
                                            <div className="stats-mini">
                                                <div className="stat-item">
                                                    <Clock size={14} />
                                                    <span>{plan.detalles_agenda?.length || 0} Actividades</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="plan-card-footer">
                                            <button className="btn-view">
                                                <span>Ver Detalle</span>
                                                <ChevronRight size={16} />
                                            </button>
                                            <div className="actions-group">
                                                <button className="icon-btn" title="Exportar">
                                                    <ExternalLink size={16} />
                                                </button>
                                                <button className="icon-btn delete" title="Eliminar">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="empty-state card-premium"
                            >
                                <FileText size={48} />
                                <h3>No hay planes de trabajo</h3>
                                <p>No se encontraron planes semanales para los criterios seleccionados.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>

            <PlanWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onSuccess={fetchInitialData}
            />

            <style jsx>{`
                .planes-container {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .title-group h2 {
                    font-size: 2.2rem;
                    font-weight: 800;
                    color: #1e293b;
                    letter-spacing: -0.03em;
                    margin: 0;
                }

                .title-group p {
                    color: #64748b;
                    font-size: 1.1rem;
                    margin: 0;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #0ea5e9, #2563eb);
                    color: white;
                    padding: 0.8rem 1.5rem;
                    border-radius: 14px;
                    border: none;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 10px 15px -3px rgba(14, 165, 233, 0.3);
                }

                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 20px 25px -5px rgba(14, 165, 233, 0.4);
                }

                .filters-card {
                    display: flex;
                    gap: 1.5rem;
                    padding: 1.25rem 2rem;
                }

                .search-box {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    padding: 0 1.25rem;
                    height: 50px;
                    transition: all 0.2s;
                }

                .search-box:focus-within {
                    border-color: #0ea5e9;
                    background: white;
                    box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1);
                }

                .search-box input {
                    border: none;
                    background: none;
                    outline: none;
                    width: 100%;
                    font-size: 1rem;
                    margin-left: 12px;
                    color: #1e293b;
                }

                .filter-group {
                    display: flex;
                    align-items: center;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    padding: 0 1.25rem;
                    height: 50px;
                    width: 300px;
                }

                .filter-group select {
                    border: none;
                    background: none;
                    outline: none;
                    width: 100%;
                    font-size: 1rem;
                    margin-left: 12px;
                    color: #1e293b;
                    font-weight: 600;
                    cursor: pointer;
                }

                .planes-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
                    gap: 1.5rem;
                }

                .plan-card {
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    transition: all 0.3s ease;
                }

                .plan-card:hover {
                    transform: translateY(-5px);
                    border-color: #0ea5e9;
                }

                .plan-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }

                .user-info {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }

                .user-avatar {
                    width: 44px;
                    height: 44px;
                    background: #f1f5f9;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #64748b;
                }

                .user-text {
                    display: flex;
                    flex-direction: column;
                }

                .user-name {
                    font-weight: 700;
                    color: #1e293b;
                    font-size: 1rem;
                }

                .user-role {
                    font-size: 0.85rem;
                    color: #94a3b8;
                    font-weight: 500;
                }

                .status-badge {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 14px;
                    border-radius: 30px;
                    font-size: 0.75rem;
                    font-weight: 800;
                    letter-spacing: 0.02em;
                }

                .plan-card-body {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    padding: 1rem;
                    background: #f8fafc;
                    border-radius: 16px;
                }

                .date-info {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 0.95rem;
                    color: #475569;
                    font-weight: 600;
                }

                .stat-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.85rem;
                    color: #64748b;
                    font-weight: 500;
                }

                .plan-card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 0.5rem;
                }

                .btn-view {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: #f1f5f9;
                    border: none;
                    border-radius: 10px;
                    color: #475569;
                    font-weight: 700;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-view:hover {
                    background: #e2e8f0;
                    color: #1e293b;
                }

                .actions-group {
                    display: flex;
                    gap: 8px;
                }

                .icon-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    border: 1px solid #e2e8f0;
                    background: white;
                    color: #64748b;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .icon-btn:hover {
                    border-color: #0ea5e9;
                    color: #0ea5e9;
                    background: #f0f9ff;
                }

                .icon-btn.delete:hover {
                    border-color: #ef4444;
                    color: #ef4444;
                    background: #fef2f2;
                }

                .empty-state {
                    grid-column: 1 / -1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 5rem;
                    color: #94a3b8;
                    text-align: center;
                }

                .empty-state h3 {
                    margin-top: 1.5rem;
                    color: #1e293b;
                    font-weight: 700;
                }

                .plan-skeleton {
                    height: 280px;
                    background: linear-gradient(90deg, #f1f5f9 25%, #f8fafc 50%, #f1f5f9 75%);
                    background-size: 200% 100%;
                    animation: shimmer 2s infinite;
                }

                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
};

export default PlanesList;
