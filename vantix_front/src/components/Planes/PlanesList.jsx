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
    ExternalLink,
    X
} from 'lucide-react';

const PlanesList = () => {
    const [planes, setPlanes] = useState([]);
    const [empleados, setEmpleados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterEmpleado, setFilterEmpleado] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, planId: null });

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

    const handleDelete = async (id) => {
        setDeleteModal({ isOpen: true, planId: id });
    };

    const confirmDelete = async () => {
        try {
            setLoading(true);
            await planService.delete(deleteModal.planId);
            setDeleteModal({ isOpen: false, planId: null });
            fetchInitialData();
        } catch (error) {
            alert('Error al eliminar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = (plan) => {
        window.location.href = `/planes/detalle?id=${plan.id_plan}`;
    };

    const handleExport = (plan) => {
        const headers = ["Fecha", "Tipo", "Cliente", "Observaciones"];
        const rows = plan.detalles_agenda?.map(act => [
            new Date(act.fecha_actividad).toLocaleDateString(),
            act.tipo_actividad,
            act.nombre_cliente,
            act.observaciones || ""
        ]) || [];

        const csvContent = [
            ["Plan Semanal - " + (empleados.find(e => e.id_empleado === plan.id_empleado)?.nombre_completo || "Asesor")],
            ["Periodo: " + new Date(plan.fecha_inicio_semana).toLocaleDateString() + " al " + new Date(plan.fecha_fin_semana).toLocaleDateString()],
            [],
            headers,
            ...rows
        ].map(e => e.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Plan_${plan.id_plan}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="planes-container">
            <div className="section-header">
                <div className="title-group">
                    <h2>Planes Semanales</h2>
                    <p>Gestión de agendas y hojas de ruta de los asesores de venta.</p>
                </div>
                <button className="btn-primary" onClick={() => setIsWizardOpen(true)}>
                    <Plus size={20} />
                    <span className="btn-text">Nuevo Plan Semanal</span>
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
                                            <button className="btn-view" onClick={() => handleViewDetail(plan)}>
                                                <span>Ver Detalle</span>
                                                <ChevronRight size={16} />
                                            </button>
                                            <div className="actions-group">
                                                <button
                                                    className="icon-btn"
                                                    title="Exportar"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleExport(plan);
                                                    }}
                                                >
                                                    <ExternalLink size={16} />
                                                </button>
                                                <button
                                                    className="icon-btn delete"
                                                    title="Eliminar"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(plan.id_plan);
                                                    }}
                                                >
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

            <AnimatePresence>
                {deleteModal.isOpen && (
                    <div className="modal-overlay" onClick={() => setDeleteModal({ isOpen: false, planId: null })}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="confirm-modal card-premium"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="confirm-icon-wrap">
                                <div className="icon-bg-red">
                                    <Trash2 size={32} />
                                </div>
                            </div>
                            <h3>¿Eliminar Plan de Trabajo?</h3>
                            <p>Esta acción no se puede deshacer. Se eliminará permanentemente la agenda y los objetivos asignados.</p>

                            <div className="confirm-actions">
                                <button
                                    className="btn-cancel"
                                    onClick={() => setDeleteModal({ isOpen: false, planId: null })}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="btn-confirm-delete"
                                    onClick={confirmDelete}
                                    disabled={loading}
                                >
                                    {loading ? 'Eliminando...' : 'Sí, Eliminar Plan'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
                    gap: 12px;
                }

                .user-info {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    flex: 1;
                    min-width: 0;
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
                    min-width: 0;
                    flex: 1;
                }

                .user-name {
                    font-weight: 700;
                    color: #1e293b;
                    font-size: 1rem;
                    line-height: 1.2;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
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
                    padding: 6px 12px;
                    border-radius: 30px;
                    font-size: 0.7rem;
                    font-weight: 800;
                    letter-spacing: 0.02em;
                    white-space: nowrap;
                    flex-shrink: 0;
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

                .modal-overlay {
                    position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7);
                    backdrop-filter: blur(8px); display: flex; align-items: center;
                    justify-content: center; z-index: 5000;
                }
                .detail-modal {
                    width: 90%; max-width: 600px; background: white; border-radius: 24px;
                    display: flex; flex-direction: column; overflow: hidden; padding: 24px;
                }
                .detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                .detail-header h3 { margin: 0; font-size: 1.5rem; font-weight: 800; color: #1e293b; }
                .close-btn { background: #f1f5f9; border: none; padding: 8px; border-radius: 50%; cursor: pointer; color: #64748b; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                .info-item label { font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block; margin-bottom: 4px; }
                .info-item p { margin: 0; font-weight: 700; color: #1e293b; }
                .status-val { color: #0ea5e9; }
                .activities-section h4 { font-size: 0.9rem; font-weight: 800; color: #1e293b; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
                .activities-list { display: flex; flex-direction: column; gap: 12px; }
                .act-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8fafc; border-radius: 12px; }
                .act-dot { width: 8px; height: 8px; background: #0ea5e9; border-radius: 50%; }
                .act-info { flex: 1; display: flex; flex-direction: column; }
                .act-type { font-size: 0.8rem; font-weight: 800; color: #1e293b; }
                .act-client { font-size: 0.75rem; color: #64748b; }
                .act-date { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: capitalize; }

                .confirm-modal {
                    width: 100%;
                    max-width: 420px;
                    padding: 2.5rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    gap: 1.5rem;
                    border-radius: 32px;
                }

                .confirm-icon-wrap {
                    width: 80px;
                    height: 80px;
                    background: #fef2f2;
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #ef4444;
                    margin-bottom: 0.5rem;
                }

                .confirm-modal h3 {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #0f172a;
                    margin: 0;
                }

                .confirm-modal p {
                    color: #64748b;
                    font-size: 1rem;
                    line-height: 1.5;
                    margin: 0;
                    font-weight: 500;
                }

                .confirm-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    width: 100%;
                    margin-top: 1rem;
                }

                .btn-cancel {
                    padding: 0.8rem;
                    border-radius: 14px;
                    border: 1.5px solid #e2e8f0;
                    background: white;
                    color: #64748b;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-cancel:hover { background: #f8fafc; border-color: #cbd5e1; color: #1e293b; }

                .btn-confirm-delete {
                    padding: 0.8rem;
                    border-radius: 14px;
                    border: none;
                    background: #ef4444;
                    color: white;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
                }
                .btn-confirm-delete:hover { background: #dc2626; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3); }
                .btn-confirm-delete:disabled { opacity: 0.7; cursor: not-allowed; }
                @media (max-width: 1024px) {
                    .section-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1.5rem;
                    }
                    .filters-card {
                        flex-direction: column;
                        padding: 1.25rem;
                    }
                    .filter-group {
                        width: 100%;
                    }
                    .planes-grid {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 640px) {
                    .title-group h2 {
                        font-size: 1.8rem;
                    }
                    .btn-text {
                        display: none;
                    }
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
                        box-shadow: 0 10px 25px rgba(14, 165, 233, 0.5);
                    }
                    .plan-card {
                        padding: 1.25rem;
                    }
                    .main-header {
                        padding-left: 4.5rem;
                    }
                    .confirm-modal {
                        padding: 1.5rem;
                        width: 90%;
                    }
                }
            `}</style>
        </div>
    );
};

export default PlanesList;
