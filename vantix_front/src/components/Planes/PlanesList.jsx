import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { planService, empleadoService } from '../../services/api';
import PlanWizard from './PlanWizard';
import PremiumCard from '../Common/PremiumCard';
import Badge from '../Common/Badge';
import SearchInput from '../Common/SearchInput';
import LoadingSpinner from '../Common/LoadingSpinner';
import EmptyState from '../Common/EmptyState';
import ConfirmModal from '../Common/ConfirmModal';
import {
    Calendar,
    Plus,
    ChevronRight,
    Clock,
    User,
    FileText,
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

    const getStatusVariant = (status) => {
        switch (status) {
            case 'Aprobado': return 'success';
            case 'Borrador': return 'default';
            case 'Cerrado': return 'info';
            case 'Rechazado': return 'error';
            default: return 'default';
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
            act.dia_semana,
            act.tipo_actividad,
            act.cliente?.nombre_cliente || "N/A",
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

            <PremiumCard className="filters-card" hover={false}>
                <SearchInput
                    placeholder="Buscar por asesor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="filter-group">
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
            </PremiumCard>

            {loading ? (
                <div className="loading-wrapper">
                    <LoadingSpinner message="Consultando planes de trabajo..." />
                </div>
            ) : filteredPlanes.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="No hay planes"
                    message="No se encontraron planes semanales para los asesores seleccionados."
                    actionLabel="Nuevo Plan"
                    onAction={() => setIsWizardOpen(true)}
                />
            ) : (
                <div className="planes-grid">
                    {filteredPlanes.map((plan) => {
                        const empleado = empleados.find(e => e.id_empleado === plan.id_empleado);

                        return (
                            <PremiumCard key={plan.id_plan} className="plan-card">
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
                                    <Badge variant={getStatusVariant(plan.estado)}>
                                        {plan.estado}
                                    </Badge>
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
                            </PremiumCard>
                        );
                    })}
                </div>
            )}

            <PlanWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onSuccess={fetchInitialData}
            />

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, planId: null })}
                onConfirm={confirmDelete}
                title="¿Eliminar Plan de Trabajo?"
                message="Esta acción no se puede deshacer. Se eliminará permanentemente la agenda y los objetivos asignados."
                confirmLabel="Sí, Eliminar Plan"
            />

            <style jsx>{`
                .planes-container { display: flex; flex-direction: column; gap: 2rem; }
                .section-header { display: flex; justify-content: space-between; align-items: center; }
                .title-group h2 { font-size: 2.2rem; font-weight: 800; color: var(--text-heading); letter-spacing: -0.03em; margin: 0; }
                .title-group p { color: var(--text-muted); font-size: 1.1rem; margin: 0; }

                .btn-primary {
                    background: var(--bg-sidebar); color: white; padding: 0.8rem 1.5rem; border-radius: 14px;
                    border: none; display: flex; align-items: center; gap: 12px; font-weight: 700; cursor: pointer;
                    transition: all 0.3s; box-shadow: var(--shadow-md);
                }
                .btn-primary:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }

                .filters-card { display: flex; gap: 1.5rem; align-items: center; padding: 1rem 1.5rem; }
                .filter-group { display: flex; align-items: center; background: var(--bg-app); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 0 1rem; height: 44px; width: 280px; }
                .filter-group select { border: none; background: none; outline: none; width: 100%; font-size: 0.9rem; color: var(--text-heading); font-weight: 600; cursor: pointer; }

                .planes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 1.5rem; }
                .plan-card { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
                .plan-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
                .user-info { display: flex; gap: 12px; align-items: center; flex: 1; min-width: 0; }
                .user-avatar { width: 44px; height: 44px; background: var(--bg-app); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
                .user-text { display: flex; flex-direction: column; min-width: 0; flex: 1; }
                .user-name { font-weight: 700; color: var(--text-heading); font-size: 1rem; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .user-role { font-size: 0.85rem; color: var(--text-muted); font-weight: 500; }

                .plan-card-body { display: flex; flex-direction: column; gap: 1rem; padding: 1rem; background: var(--bg-app); border-radius: 16px; }
                .date-info { display: flex; align-items: center; gap: 10px; font-size: 0.95rem; color: var(--text-body); font-weight: 600; }
                .stat-item { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-muted); font-weight: 500; }

                .plan-card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 0.5rem; }
                .btn-view { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: var(--bg-app); border: 1px solid var(--border-subtle); border-radius: 10px; color: var(--text-body); font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; }
                .btn-view:hover { border-color: var(--primary); color: var(--primary); }

                .actions-group { display: flex; gap: 8px; }
                .icon-btn { width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--border-subtle); background: var(--bg-panel); color: var(--text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
                .icon-btn:hover { border-color: var(--primary); color: var(--primary); background: var(--bg-app); }
                .icon-btn.delete:hover { border-color: var(--error); color: var(--error); background: var(--error-glow); }

                .loading-wrapper { display: flex; justify-content: center; padding: 4rem; }

                @media (max-width: 1024px) {
                    .section-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
                    .filters-card { flex-direction: column; align-items: stretch; }
                    .filter-group { width: 100%; }
                    .planes-grid { grid-template-columns: 1fr; }
                }

                @media (max-width: 640px) {
                    .title-group h2 { font-size: 1.8rem; }
                    .btn-text { display: none; }
                    .btn-primary { position: fixed; bottom: 1.5rem; right: 1.5rem; width: 56px; height: 56px; border-radius: 50%; padding: 0; justify-content: center; z-index: 100; box-shadow: var(--shadow-lg); }
                }
            `}</style>
        </div>
    );
};

export default PlanesList;
