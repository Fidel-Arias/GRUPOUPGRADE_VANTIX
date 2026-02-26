import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { planService, empleadoService } from '../../services/api';
import PlanWizard from './PlanWizard';
import PageHeader from '../Common/PageHeader';
import PremiumCard from '../Common/PremiumCard';
import Badge from '../Common/Badge';
import SearchInput from '../Common/SearchInput';
import LoadingSpinner from '../Common/LoadingSpinner';
import EmptyState from '../Common/EmptyState';
import ConfirmModal from '../Common/ConfirmModal';
import AsesorPlanCard from './AsesorPlanCard';
import {
    Calendar,
    Plus,
    CalendarCheck,
    ChevronRight,
    ChevronLeft,
    Clock,
    User,
    FileText,
    Trash2,
    ExternalLink,
    ArrowLeft,
    AlertTriangle,
    CheckCircle2,
    Briefcase
} from 'lucide-react';

const PlanesList = () => {
    const [planes, setPlanes] = useState([]);
    const [empleados, setEmpleados] = useState([]);
    const [selectedAsesor, setSelectedAsesor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterEmpleado, setFilterEmpleado] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonday, setSelectedMonday] = useState(null);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, planId: null });

    useEffect(() => {
        const monday = getMonday(new Date());
        setSelectedMonday(monday);
        fetchInitialData();
    }, []);

    function getMonday(d) {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    }

    const changeWeek = (offset) => {
        const newMonday = new Date(selectedMonday);
        newMonday.setDate(newMonday.getDate() + (offset * 7));
        setSelectedMonday(newMonday);
    };

    const resetToCurrentWeek = () => {
        setSelectedMonday(getMonday(new Date()));
    };

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [planesData, empleadosData] = await Promise.all([
                planService.getAll(),
                empleadoService.getAll()
            ]);
            setPlanes(planesData);
            setEmpleados(empleadosData.filter(e => !e.is_admin));
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectedMondayStr = selectedMonday ? selectedMonday.toISOString().split('T')[0] : '';

    const asesoresResumen = empleados.map(emp => {
        const planSemanaActual = planes.find(p =>
            p.id_empleado === emp.id_empleado &&
            p.fecha_inicio_semana.startsWith(selectedMondayStr)
        );

        const misPlanes = planes.filter(p => p.id_empleado === emp.id_empleado);

        return {
            ...emp,
            tiene_plan_actual: !!planSemanaActual,
            plan_actual: planSemanaActual,
            total_planes: misPlanes.length
        };
    }).sort((a, b) => (a.tiene_plan_actual === b.tiene_plan_actual) ? 0 : a.tiene_plan_actual ? 1 : -1);

    const getStatusVariant = (status) => {
        switch (status) {
            case 'Completado': return 'success';
            case 'En Progreso': return 'info';
            case 'Pendiente': return 'warning';
            default: return 'neutral';
        }
    };

    const filteredPlanes = planes.filter(p => {
        if (!selectedAsesor) return false;
        return p.id_empleado === selectedAsesor.id_empleado;
    });

    const filteredAsesores = asesoresResumen.filter(a =>
        a.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAsesorSelect = (asesor) => {
        setSelectedAsesor(asesor);
        setSearchTerm('');
    };

    const handleBack = () => {
        setSelectedAsesor(null);
        setSearchTerm('');
    };

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
            headers,
            ...rows
        ].map(e => e.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `plan_semanal_${plan.id_plan}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="planes-container">
            <PageHeader
                title={selectedAsesor ? `Planes de ${selectedAsesor.nombre_completo.split(' ')[0]}` : 'Planes Semanales'}
                description={selectedAsesor ? `Historial de planes de trabajo y agendas.` : 'Gestión de agendas y cumplimiento de los asesores.'}
                icon={CalendarCheck}
                breadcrumb={selectedAsesor ? ['Apps', 'Planes', selectedAsesor.nombre_completo.split(' ')[0]] : ['Apps', 'Planes']}
                actions={
                    <>
                        {selectedAsesor && (
                            <button className="back-btn-elite" onClick={handleBack}>
                                <ArrowLeft size={18} />
                                <span>Volver</span>
                            </button>
                        )}
                        <button className="btn-primary" onClick={() => setIsWizardOpen(true)}>
                            <Plus size={20} />
                            <span className="btn-text">Nuevo Plan</span>
                        </button>
                    </>
                }
            />

            {!selectedAsesor ? (
                <>
                    <PremiumCard className="filters-card" hover={false}>
                        <SearchInput
                            placeholder="Buscar asesor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="week-navigation">
                            <button className="nav-btn" onClick={() => changeWeek(-1)} title="Semana Anterior">
                                <ChevronLeft size={20} />
                            </button>
                            <div className="week-label-alt">
                                <Calendar size={18} />
                                <div className="week-info">
                                    <span className="label">Semana del Lunes</span>
                                    <span className="date">{selectedMonday ? selectedMonday.toLocaleDateString() : ''}</span>
                                </div>
                            </div>
                            <button className="nav-btn" onClick={() => changeWeek(1)} title="Siguiente Semana">
                                <ChevronRight size={20} />
                            </button>
                            <button className="today-btn" onClick={resetToCurrentWeek}>
                                Hoy
                            </button>
                        </div>
                    </PremiumCard>

                    {loading ? (
                        <div className="loading-wrapper">
                            <LoadingSpinner message="Consultando situación de planes..." />
                        </div>
                    ) : (
                        <div className="asesores-grid">
                            {filteredAsesores.map((asesor, idx) => (
                                <AsesorPlanCard
                                    key={asesor.id_empleado}
                                    asesor={asesor}
                                    idx={idx}
                                    getStatusVariant={getStatusVariant}
                                    onClick={() => handleAsesorSelect(asesor)}
                                />
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <>
                    {loading ? (
                        <div className="loading-wrapper">
                            <LoadingSpinner message="Cargando historial de planes..." />
                        </div>
                    ) : filteredPlanes.length === 0 ? (
                        <EmptyState
                            icon={FileText}
                            title="Sin historial"
                            message="Este asesor aún no tiene planes de trabajo registrados."
                            actionLabel="Crear Primer Plan"
                            onAction={() => setIsWizardOpen(true)}
                        />
                    ) : (
                        <div className="planes-grid">
                            {filteredPlanes.map((plan) => (
                                <PremiumCard key={plan.id_plan} className="plan-card">
                                    <div className="plan-card-header">
                                        <div className="date-info-main">
                                            <div className="calendar-icon-box">
                                                <Calendar size={20} />
                                            </div>
                                            <div className="date-text">
                                                <span className="week-title">Plan de Trabajo</span>
                                                <span className="week-dates">{new Date(plan.fecha_inicio_semana).toLocaleDateString()} - {new Date(plan.fecha_fin_semana).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <Badge variant={getStatusVariant(plan.estado)}>
                                            {plan.estado}
                                        </Badge>
                                    </div>

                                    <div className="plan-card-body-alt">
                                        <div className="plan-stat">
                                            <Clock size={16} />
                                            <span>{plan.detalles_agenda?.length || 0} Actividades planificadas</span>
                                        </div>
                                    </div>

                                    <div className="plan-card-footer">
                                        <button className="btn-view-premium" onClick={() => handleViewDetail(plan)}>
                                            <span>Ver Informe</span>
                                            <ChevronRight size={18} />
                                        </button>
                                        <div className="footer-actions">
                                            <button className="action-btn" onClick={() => handleExport(plan)} title="Exportar CSV">
                                                <ExternalLink size={18} />
                                            </button>
                                            <button className="action-btn delete" onClick={() => handleDelete(plan.id_plan)} title="Eliminar">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </PremiumCard>
                            ))}
                        </div>
                    )}
                </>
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
                .planes-container { display: flex; flex-direction: column; gap: 1.5rem; }
                
                .back-btn-elite {
                    display: flex; align-items: center; gap: 8px;
                    padding: 0.8rem 1.25rem; border-radius: 14px;
                    border: 1px solid var(--border-subtle); background: white;
                    color: var(--text-body); font-weight: 700; cursor: pointer;
                    transition: all 0.2s;
                }
                .back-btn-elite:hover { border-color: var(--primary); color: var(--primary); transform: translateX(-4px); }
                :global(.dark) .back-btn-elite { background: var(--bg-panel); border-color: var(--border-light); }

                .btn-primary {
                    background: var(--bg-sidebar); color: white; padding: 0.8rem 1.5rem; border-radius: 14px;
                    border: none; display: flex; align-items: center; gap: 12px; font-weight: 700; cursor: pointer;
                    transition: all 0.3s; box-shadow: var(--shadow-md);
                }
                .btn-primary:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }

                .filters-card { display: flex; gap: 1.5rem; align-items: center; padding: 1rem 1.5rem; justify-content: space-between; }
                .week-navigation { display: flex; align-items: center; gap: 1rem; }
                .nav-btn {
                    width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--border-subtle);
                    background: var(--bg-panel); color: var(--text-muted); display: flex; align-items: center;
                    justify-content: center; cursor: pointer; transition: all 0.2s;
                }
                .nav-btn:hover { border-color: var(--primary); color: var(--primary); background: var(--bg-app); }
                
                .week-label-alt {
                    display: flex; align-items: center; gap: 12px; padding: 4px 12px;
                    background: var(--bg-app); border-radius: 12px; border: 1px solid var(--border-subtle);
                    min-width: 180px;
                }
                .week-info { display: flex; flex-direction: column; }
                .week-info .label { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; line-height: 1; }
                .week-info .date { font-size: 0.95rem; font-weight: 700; color: var(--primary); }

                .today-btn {
                    padding: 8px 16px; border-radius: 10px; border: 1px solid var(--primary-soft);
                    background: var(--primary-glow); color: var(--primary); font-weight: 700; font-size: 0.85rem;
                    cursor: pointer; transition: all 0.2s;
                }
                .today-btn:hover { background: var(--primary); color: white; }

                .asesores-grid, .planes-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); 
                    gap: 1.5rem; align-items: stretch;
                }
                
                :global(.plan-card) { padding: 1.5rem !important; display: flex; flex-direction: column; gap: 1.5rem; }
                .plan-card-header { display: flex; justify-content: space-between; align-items: flex-start; }
                .date-info-main { display: flex; gap: 15px; align-items: center; }
                .calendar-icon-box { 
                    width: 44px; height: 44px; border-radius: 12px; 
                    background: var(--bg-app); color: var(--primary);
                    display: flex; align-items: center; justify-content: center;
                    border: 1px solid var(--border-subtle);
                }
                .date-text { display: flex; flex-direction: column; }
                .week-title { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
                .week-dates { font-size: 1rem; font-weight: 700; color: var(--text-heading); }

                .plan-card-body-alt { padding: 1.25rem; background: var(--bg-app); border-radius: 16px; border: 1px solid var(--border-light); }
                .plan-stat { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; color: var(--text-body); font-weight: 600; }

                .plan-card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
                .btn-view-premium {
                    padding: 10px 20px; border-radius: 12px; border: 1px solid var(--border-subtle);
                    background: white; color: var(--text-heading); font-weight: 800; font-size: 0.9rem;
                    display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s;
                }
                .btn-view-premium:hover { border-color: var(--primary); color: var(--primary); transform: translateY(-2px); }
                :global(.dark) .btn-view-premium { background: var(--bg-panel); border-color: var(--border-light); }

                .footer-actions { display: flex; gap: 8px; }
                .action-btn { 
                    width: 40px; height: 40px; border-radius: 10px; border: 1px solid var(--border-subtle);
                    background: var(--bg-panel); color: var(--text-muted); 
                    display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;
                }
                .action-btn:hover { border-color: var(--primary); color: var(--primary); background: var(--bg-app); }
                .action-btn.delete:hover { border-color: #ef4444; color: #ef4444; background: rgba(239, 68, 68, 0.05); }

                .loading-wrapper { display: flex; justify-content: center; padding: 5rem; width: 100%; }

                @media (max-width: 1024px) {
                    .filters-card { flex-direction: column; align-items: stretch; gap: 1rem; }
                    .planes-grid, .asesores-grid { grid-template-columns: 1fr; }
                }

                @media (max-width: 640px) {
                    .btn-text { display: none; }
                    .btn-primary { 
                        position: fixed; bottom: 1.5rem; right: 1.5rem; width: 56px; height: 56px; 
                        border-radius: 50%; padding: 0; justify-content: center; z-index: 100; box-shadow: var(--shadow-lg); 
                    }
                }
            `}</style>
        </div>
    );
};

export default PlanesList;
