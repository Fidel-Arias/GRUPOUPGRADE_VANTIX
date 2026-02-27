import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { planService, empleadoService, authService } from '../../services/api';
// import PlanWizard from './PlanWizard'; // Removed as it is now a page
import PageHeader from '../Common/PageHeader';
import PremiumCard from '../Common/PremiumCard';
import Badge from '../Common/Badge';
import LoadingSpinner from '../Common/LoadingSpinner';
import EmptyState from '../Common/EmptyState';
import ConfirmModal from '../Common/ConfirmModal';
import WeekPicker from '../Common/WeekPicker';
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
    Briefcase,
    Activity,
    Users,
    TrendingUp,
    Search
} from 'lucide-react';

const PlanesList = () => {
    const [user, setUser] = useState(null);
    const [planes, setPlanes] = useState([]);
    const [empleados, setEmpleados] = useState([]);
    const [selectedAsesor, setSelectedAsesor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [selectedMonday, setSelectedMonday] = useState(null);
    // const [isWizardOpen, setIsWizardOpen] = useState(false); // Removed as it is now a page
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, planId: null });

    useEffect(() => {
        const monday = getMonday(new Date());
        setSelectedMonday(monday);
        const currentUser = authService.getUser();
        setUser(currentUser);
        if (currentUser) {
            fetchInitialData(currentUser);
        } else {
            setLoading(false);
        }
    }, []);

    function getMonday(d) {
        if (!d) return null;
        const date = new Date(d);
        // Handle timezone offset if it's a date string without time
        if (typeof d === 'string' && !d.includes('T')) {
            const [y, m, day] = d.split('-').map(Number);
            date.setFullYear(y, m - 1, day);
        }
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

    const fetchInitialData = async (specificUser = null, targetDate = null) => {
        const u = specificUser || user || authService.getUser();
        if (!u) return;

        try {
            setLoading(true);
            let planesData;
            let currentEmpleados = empleados;

            if (u.is_admin) {
                const [pData, eData] = await Promise.all([
                    planService.getAll(0, 1000),
                    empleadoService.getAll()
                ]);
                planesData = pData;
                setEmpleados(eData.filter(e => !e.is_admin));
            } else {
                planesData = await planService.getAll(0, 500, u.id_empleado);
                setEmpleados([u]);
                setSelectedAsesor(u);
            }

            setPlanes(planesData);

            if (planesData.length > 0) {
                const effectiveDate = targetDate || selectedMonday || getMonday(new Date());
                const targetMondayStr = normalizeDateStr(effectiveDate);

                const foundPlan = planesData.find(p => normalizeDateStr(p.fecha_inicio_semana) === targetMondayStr);

                if (foundPlan) {
                    setSelectedPlanId(foundPlan.id_plan);
                    setSelectedMonday(getMonday(foundPlan.fecha_inicio_semana));
                } else {
                    if (targetDate) {
                        setSelectedMonday(getMonday(targetDate));
                    }
                    setSelectedPlanId('');
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const normalizeDateStr = (d) => {
        if (!d) return '';
        const date = getMonday(d);
        if (!date) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const selectedMondayStr = normalizeDateStr(selectedMonday);

    const asesoresResumen = empleados.map(emp => {
        const planSemanaActual = planes.find(p =>
            String(p.id_empleado) === String(emp.id_empleado) &&
            normalizeDateStr(p.fecha_inicio_semana) === selectedMondayStr
        );

        const misPlanes = planes.filter(p => String(p.id_empleado) === String(emp.id_empleado));

        return {
            ...emp,
            tiene_plan_actual: !!planSemanaActual,
            plan_actual: planSemanaActual,
            total_planes: misPlanes.length
        };
    }).sort((a, b) => {
        if (a.tiene_plan_actual !== b.tiene_plan_actual) {
            return a.tiene_plan_actual ? -1 : 1;
        }
        return a.nombre_completo.localeCompare(b.nombre_completo);
    });

    const uniqueWeekPlans = planes.reduce((acc, current) => {
        const mondayStr = normalizeDateStr(current.fecha_inicio_semana);
        if (!acc.find(p => normalizeDateStr(p.fecha_inicio_semana) === mondayStr)) {
            // Keep a representative plan but ensure its date points to the start of the week for the picker
            acc.push({ ...current, fecha_inicio_semana: mondayStr });
        }
        return acc;
    }, []);

    const stats = {
        totalAsesores: empleados.length,
        conPlan: asesoresResumen.filter(a => a.tiene_plan_actual).length,
        totalActividades: asesoresResumen.reduce((acc, curr) => acc + (curr.plan_actual?.detalles_agenda?.length || 0), 0),
        planesCompletados: asesoresResumen.filter(a => a.plan_actual?.estado === 'Completado').length
    };

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

    const handlePlanChange = (planId) => {
        const plan = planes.find(p => String(p.id_plan) === String(planId));
        if (plan) {
            const newMonday = getMonday(plan.fecha_inicio_semana);
            setSelectedMonday(newMonday);
            setSelectedPlanId(planId);
            // Pasar la fecha explícitamente para evitar que se use el estado antiguo (stale state)
            fetchInitialData(null, newMonday);
        }
    };

    const handleAsesorSelect = (asesor) => {
        // Si el asesor ya tiene un plan en la semana seleccionada, vamos directo al detalle
        if (asesor.tiene_plan_actual && asesor.plan_actual?.id_plan) {
            window.location.href = `/planes/detalle?id=${asesor.plan_actual.id_plan}`;
            return;
        }

        // Si no, mostramos el historial del asesor (comportamiento original)
        setSelectedAsesor(asesor);
    };

    const handleBack = () => {
        if (user?.is_admin) {
            setSelectedAsesor(null);
        }
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
        <div className="planes-premium-view">
            {/* Background Ornaments */}
            <div className="p-bg-blob blob-1" />
            <div className="p-bg-blob blob-2" />
            <div className="p-noise-overlay" />

            <PageHeader
                title={selectedAsesor ? `Planes de ${selectedAsesor.nombre_completo.split(' ')[0]}` : 'Planes Semanales'}
                description={selectedAsesor ? `Historial de planes de trabajo y agendas.` : 'Gestión de agendas y cumplimiento de los asesores.'}
                icon={CalendarCheck}
                breadcrumb={selectedAsesor ? ['Apps', 'Planes', selectedAsesor.nombre_completo.split(' ')[0]] : ['Apps', 'Planes']}
                actions={
                    <div className="p-master-controls">
                        {user?.is_admin && selectedAsesor ? (
                            <button className="back-btn-elite glass" onClick={handleBack}>
                                <ArrowLeft size={18} />
                                <span>Volver al equipo</span>
                            </button>
                        ) : null}

                        {user?.is_admin && (
                            <div className="control-group glass">
                                <WeekPicker
                                    plans={uniqueWeekPlans}
                                    selectedPlanId={selectedPlanId}
                                    onChange={handlePlanChange}
                                    isAdmin={false}
                                />
                            </div>
                        )}

                        <button className="btn-primary-glow" onClick={() => window.location.href = '/planes/nuevo'}>
                            <Plus size={20} />
                            <span className="btn-text">Nuevo Plan</span>
                        </button>
                    </div>
                }
            />

            {!selectedAsesor && (
                <div className="p-hero-stats">
                    <PremiumCard className="hero-stat-card" hover={false}>
                        <div className="stat-icon-box main">
                            <Users size={24} />
                        </div>
                        <div className="stat-content">
                            <label>Cumplimiento Equipo</label>
                            <div className="value-row">
                                <span className="value">{Math.round((stats.conPlan / (stats.totalAsesores || 1)) * 100)}%</span>
                                <span className="unit">{stats.conPlan} de {stats.totalAsesores}</span>
                            </div>
                        </div>
                        <div className="stat-progress">
                            <div className="progress-bar" style={{ width: `${(stats.conPlan / (stats.totalAsesores || 1)) * 100}%` }}></div>
                        </div>
                    </PremiumCard>

                    <PremiumCard className="hero-stat-card activity" hover={false}>
                        <div className="stat-icon-box indigo">
                            <Activity size={24} />
                        </div>
                        <div className="stat-content">
                            <label>Actividad Planificada</label>
                            <div className="value-row">
                                <span className="value">{stats.totalActividades}</span>
                                <span className="unit">TOTAL ITEMS</span>
                            </div>
                        </div>
                        <div className="stat-progress">
                            <div className="progress-bar" style={{
                                width: '100%',
                                background: 'linear-gradient(90deg, #6366f1, #818cf8)'
                            }}></div>
                        </div>
                    </PremiumCard>

                    <PremiumCard className="hero-stat-card success" hover={false}>
                        <div className="stat-icon-box emerald">
                            <TrendingUp size={24} />
                        </div>
                        <div className="stat-content">
                            <label>Planes Finalizados</label>
                            <div className="value-row">
                                <span className="value">{stats.planesCompletados}</span>
                                <span className="unit">DICC-SEMANA</span>
                            </div>
                        </div>
                        <div className="stat-progress">
                            <div className="progress-bar" style={{
                                width: `${(stats.planesCompletados / (stats.conPlan || 1)) * 100}%`,
                                background: 'linear-gradient(90deg, #10b981, #34d399)'
                            }}></div>
                        </div>
                    </PremiumCard>
                </div>
            )}


            {selectedAsesor && user?.is_admin && (
                <div className="p-hero-stats">
                    <PremiumCard className="hero-stat-card" hover={false}>
                        <div className="stat-icon-box main">
                            <Calendar size={24} />
                        </div>
                        <div className="stat-content">
                            <label>Planes Totales</label>
                            <div className="value-row">
                                <span className="value">{filteredPlanes.length}</span>
                                <span className="unit">PLANES</span>
                            </div>
                        </div>
                        <div className="stat-progress">
                            <div className="progress-bar" style={{ width: '100%' }}></div>
                        </div>
                    </PremiumCard>

                    <PremiumCard className="hero-stat-card activity" hover={false}>
                        <div className="stat-icon-box indigo">
                            <FileText size={24} />
                        </div>
                        <div className="stat-content">
                            <label>Último Plan</label>
                            <div className="value-row">
                                <span className="value">{filteredPlanes[0]?.detalles_agenda?.length || 0}</span>
                                <span className="unit">ACTIVIDADES</span>
                            </div>
                        </div>
                        <div className="stat-progress">
                            <div className="progress-bar" style={{ width: '100%', background: 'linear-gradient(90deg, #6366f1, #818cf8)' }}></div>
                        </div>
                    </PremiumCard>
                </div>
            )}

            {!selectedAsesor ? (
                <>
                    {loading ? (
                        <div className="loading-wrapper">
                            <LoadingSpinner message="Consultando situación de planes..." />
                        </div>
                    ) : (
                        <div className="asesores-grid">
                            {asesoresResumen.map((asesor, idx) => (
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
                            onAction={() => window.location.href = '/planes/nuevo'}
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

            {/* PlanWizard is now a separate page */}
            {/* <PlanWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onSuccess={fetchInitialData}
            /> */}

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, planId: null })}
                onConfirm={confirmDelete}
                title="¿Eliminar Plan de Trabajo?"
                message="Esta acción no se puede deshacer. Se eliminará permanentemente la agenda y los objetivos asignados."
                confirmLabel="Sí, Eliminar Plan"
            />

            <style jsx>{`
                .planes-premium-view { 
                    position: relative;
                    display: flex; 
                    flex-direction: column; 
                    gap: 2.5rem;
                    min-height: 100vh;
                    padding-bottom: 4rem;
                }

                /* Ornaments */
                .p-bg-blob {
                    position: fixed;
                    z-index: -2;
                    filter: blur(120px);
                    opacity: 0.1;
                    border-radius: 50%;
                }
                .blob-1 { top: -10%; right: -5%; width: 600px; height: 600px; background: var(--primary); }
                .blob-2 { bottom: -5%; left: -5%; width: 500px; height: 500px; background: #6366f1; }
                
                .p-noise-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: -1;
                    opacity: 0.02;
                    pointer-events: none;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
                }

                .p-master-controls {
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
                    overflow: visible;
                    height: 48px;
                    transition: all 0.2s;
                }
                .control-group.glass:focus-within {
                    background: rgba(255, 255, 255, 0.6);
                    border-color: var(--primary);
                    box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
                }
                :global(.dark) .control-group.glass {
                    background: rgba(30, 30, 30, 0.4);
                    border: 1px solid rgba(60, 60, 60, 0.5);
                }
                :global(.dark) .control-group.glass:focus-within {
                    background: rgba(30, 30, 30, 0.6);
                    border-color: var(--primary);
                    box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
                }

                .search-wrapper {
                    padding: 0 16px;
                    gap: 10px;
                    min-width: 250px;
                }
                .search-icon { color: var(--text-muted); opacity: 0.7; }
                .search-inner {
                    background: transparent;
                    border: none;
                    outline: none;
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: var(--text-heading);
                    width: 100%;
                }
                :global(.dark) .search-inner { color: white; }

                .week-nav-group {
                    padding: 4px;
                    gap: 4px;
                }
                .nav-btn-mini {
                    width: 32px;
                    height: 32px;
                    border-radius: 10px;
                    border: none;
                    background: transparent;
                    color: var(--text-muted);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .nav-btn-mini:hover { background: rgba(0,0,0,0.05); color: var(--primary); }
                :global(.dark) .nav-btn-mini:hover { background: rgba(255,255,255,0.05); }

                .week-display {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 0 12px;
                    font-size: 0.8rem;
                    font-weight: 800;
                    color: var(--primary);
                    cursor: pointer;
                    user-select: none;
                }

                .back-btn-elite {
                    display: flex; align-items: center; gap: 8px;
                    padding: 0 1.25rem; border-radius: 16px;
                    font-weight: 800; font-size: 0.85rem; cursor: pointer;
                    transition: all 0.2s; height: 48px; border: 1px solid rgba(255,255,255,0.5);
                }
                .back-btn-elite:hover { background: rgba(255,255,255,0.6); transform: translateX(-4px); color: var(--primary); }
                :global(.dark) .back-btn-elite {
                    background: rgba(30, 30, 30, 0.4);
                    border: 1px solid rgba(60, 60, 60, 0.5);
                    color: white;
                }
                :global(.dark) .back-btn-elite:hover { background: rgba(30, 30, 30, 0.6); color: var(--primary); }


                .btn-primary-glow {
                    background: var(--bg-sidebar); 
                    color: white; 
                    padding: 0 1.5rem; 
                    border-radius: 16px;
                    border: none; 
                    display: flex; 
                    align-items: center; 
                    gap: 10px; 
                    font-weight: 800; 
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.3s; 
                    box-shadow: 0 10px 20px -5px rgba(0, 10, 30, 0.2);
                    height: 48px;
                }
                .btn-primary-glow:hover { transform: translateY(-2px); box-shadow: 0 15px 25px -5px rgba(0, 10, 30, 0.3); }

                /* Stats Hero */
                .p-hero-stats {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1.5rem;
                }
                :global(.hero-stat-card) {
                    padding: 1.5rem !important;
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    position: relative;
                    overflow: hidden;
                    border: 1px solid rgba(255,255,255,0.3);
                    background: rgba(255,255,255,0.4) !important;
                    backdrop-filter: blur(10px);
                }
                :global(.dark) :global(.hero-stat-card) {
                    background: rgba(30, 30, 30, 0.4) !important;
                    border: 1px solid rgba(60, 60, 60, 0.5);
                }

                .stat-icon-box {
                    width: 56px; height: 56px; border-radius: 16px;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .stat-icon-box.main { background: #eff6ff; color: #3b82f6; }
                .stat-icon-box.indigo { background: #eef2ff; color: #6366f1; }
                .stat-icon-box.emerald { background: #ecfdf5; color: #10b981; }
                :global(.dark) .stat-icon-box.main { background: rgba(59, 130, 246, 0.2); }
                :global(.dark) .stat-icon-box.indigo { background: rgba(99, 102, 241, 0.2); }
                :global(.dark) .stat-icon-box.emerald { background: rgba(16, 185, 129, 0.2); }
                
                .stat-content { display: flex; flex-direction: column; gap: 4px; flex: 1; }
                .stat-content label { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
                .value-row { display: flex; align-items: baseline; gap: 6px; }
                .value { font-size: 2rem; font-weight: 900; color: var(--text-heading); letter-spacing: -0.02em; line-height: 1; }
                .unit { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); }

                .stat-progress {
                    position: absolute; bottom: 0; left: 0; right: 0; height: 4px;
                    background: rgba(0,0,0,0.03);
                }
                .progress-bar { height: 100%; border-radius: 0 2px 2px 0; background: var(--primary); transition: width 1s ease-out; }

                /* Grids */
                .asesores-grid, .planes-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); 
                    gap: 1.5rem; align-items: stretch;
                }
                
                :global(.plan-card) { 
                    padding: 1.5rem !important; 
                    display: flex; 
                    flex-direction: column; 
                    gap: 1.5rem; 
                    border: 1px solid rgba(255,255,255,0.3);
                    background: rgba(255,255,255,0.4) !important;
                    backdrop-filter: blur(10px);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }
                :global(.plan-card:hover) { transform: translateY(-8px); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1) !important; }
                :global(.dark) :global(.plan-card) {
                    background: rgba(30, 30, 30, 0.4) !important;
                    border: 1px solid rgba(60, 60, 60, 0.5);
                }

                .plan-card-header { display: flex; justify-content: space-between; align-items: flex-start; }
                .date-info-main { display: flex; gap: 15px; align-items: center; }
                .calendar-icon-box { 
                    width: 48px; height: 48px; border-radius: 14px; 
                    background: #f8fafc; color: var(--primary);
                    display: flex; align-items: center; justify-content: center;
                    border: 1px solid var(--border-subtle);
                }
                :global(.dark) .calendar-icon-box {
                    background: rgba(59, 130, 246, 0.2);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                }

                .date-text { display: flex; flex-direction: column; }
                .week-title { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
                .week-dates { font-size: 1.1rem; font-weight: 800; color: var(--text-heading); letter-spacing: -0.01em; }

                .plan-card-body-alt { 
                    padding: 1.25rem; background: #f8fafc; border-radius: 16px; 
                    border: 1px solid var(--border-light); 
                }
                :global(.dark) .plan-card-body-alt {
                    background: rgba(30, 30, 30, 0.2);
                    border: 1px solid rgba(60, 60, 60, 0.5);
                }

                .plan-stat { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; color: var(--text-body); font-weight: 700; }

                .plan-card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 5px; }
                .btn-view-premium {
                    padding: 10px 20px; border-radius: 14px; border: 1px solid var(--border-subtle);
                    background: white; color: var(--text-heading); font-weight: 800; font-size: 0.85rem;
                    display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s;
                }
                .btn-view-premium:hover { border-color: var(--primary); color: var(--primary); transform: translateY(-2px); box-shadow: var(--shadow-sm); }
                :global(.dark) .btn-view-premium { background: var(--bg-panel); border-color: var(--border-light); }

                .footer-actions { display: flex; gap: 8px; }
                .action-btn { 
                    width: 40px; height: 40px; border-radius: 12px; border: 1px solid var(--border-subtle);
                    background: white; color: var(--text-muted); 
                    display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;
                }
                .action-btn:hover { border-color: var(--primary); color: var(--primary); transform: translateY(-2px); }
                .action-btn.delete:hover { border-color: #ef4444; color: #ef4444; background: #fff1f2; }
                :global(.dark) .action-btn { background: var(--bg-panel); border-color: var(--border-light); }
                :global(.dark) .action-btn.delete:hover { background: rgba(239, 68, 68, 0.1); }


                .loading-wrapper { display: flex; justify-content: center; padding: 10rem; width: 100%; }

                @media (max-width: 1280px) {
                    .p-hero-stats { grid-template-columns: repeat(2, 1fr); }
                }

                @media (max-width: 1024px) {
                    .p-master-controls { justify-content: center; }
                    .planes-grid, .asesores-grid { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
                }

                @media (max-width: 768px) {
                    .p-hero-stats { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
};

export default PlanesList;
