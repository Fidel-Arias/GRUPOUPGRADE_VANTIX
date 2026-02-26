import React, { useState, useEffect } from 'react';
import { visitaService, planService, authService, empleadoService, BASE_URL } from '../../services/api';
import VisitaModal from './VisitaModal';
import PageHeader from '../Common/PageHeader';
import PremiumCard from '../Common/PremiumCard';
import Badge from '../Common/Badge';
import LoadingSpinner from '../Common/LoadingSpinner';
import EmptyState from '../Common/EmptyState';
import ConfirmModal from '../Common/ConfirmModal';
import PhotoPreview from '../Common/PhotoPreview';
import WeekPicker from '../Common/WeekPicker';
import {
    MapPin,
    Plus,
    Clock,
    Trash2,
    Users,
    Eye,
    ExternalLink,
    CheckCircle,
    Navigation,
    LayoutGrid,
    List,
    Activity,
    Star,
    Calendar,
    ChevronDown,
    Zap,
    Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VisitaList = () => {
    const [user, setUser] = useState(null);
    const [visitas, setVisitas] = useState([]);
    const [plans, setPlans] = useState([]);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [loading, setLoading] = useState(true);
    const [previewPhoto, setPreviewPhoto] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Team Management
    const [advisors, setAdvisors] = useState([]);
    const [selectedAdvisorId, setSelectedAdvisorId] = useState(null);
    const [loadingAdvisors, setLoadingAdvisors] = useState(false);

    useEffect(() => {
        const currentUser = authService.getUser();
        setUser(currentUser);
        if (currentUser) {
            setSelectedAdvisorId(currentUser.id_empleado);
            if (currentUser.is_admin) {
                fetchAdvisors(currentUser);
            } else {
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
            // Filter only advisors/salespeople if possible, or show all
            setAdvisors(data);

            // Start with current user
            if (currentUser.id_empleado) {
                fetchInitialData(currentUser.id_empleado);
            }
        } catch (error) {
            console.error('Error fetching advisors:', error);
            if (currentUser) {
                setAdvisors([currentUser]);
                setSelectedAdvisorId(currentUser.id_empleado);
                fetchInitialData(currentUser.id_empleado);
            }
        } finally {
            setLoadingAdvisors(false);
        }
    };

    const fetchInitialData = async (empId) => {
        if (!empId) return;
        try {
            setLoading(true);
            setVisitas([]);
            setPlans([]);
            setSelectedPlanId('');

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

                if (currentPlan) {
                    setSelectedPlanId(currentPlan.id_plan);
                    await fetchVisitas(currentPlan.id_plan);
                } else {
                    // Default to most recent
                    const mostRecent = [...planesData].sort((a, b) => new Date(b.fecha_inicio_semana) - new Date(a.fecha_inicio_semana))[0];
                    setSelectedPlanId(mostRecent.id_plan);
                    await fetchVisitas(mostRecent.id_plan);
                }
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Error fetching visits data:', error);
            setLoading(false);
        }
    };

    const fetchVisitas = async (planId) => {
        try {
            setLoading(true);
            const data = await visitaService.getAll({ id_plan: planId });
            setVisitas(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlanChange = (planId) => {
        setSelectedPlanId(planId);
        if (planId) {
            fetchVisitas(planId);
        } else {
            setVisitas([]);
        }
    };

    const handleAdvisorChange = (e) => {
        const val = e.target.value;
        if (!val) return;
        const empId = parseInt(val);
        if (isNaN(empId)) return;

        setSelectedAdvisorId(empId);
        setSelectedPlanId('');
        fetchInitialData(empId);
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await visitaService.delete(deleteConfirm);
            fetchVisitas(selectedPlanId);
            setDeleteConfirm(null);
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const stats = {
        total: visitas.length,
        assisted: visitas.filter(v => v.observaciones?.includes('[VISITA ASISTIDA')).length,
        withPhoto: visitas.filter(v => !!v.foto_url).length,
        uniqueClients: new Set(visitas.map(v => v.id_cliente)).size
    };

    const filteredVisitas = visitas;

    const getStatusVariant = (status) => {
        switch (status) {
            case 'Venta cerrada': return 'success';
            case 'Cliente interesado': return 'info';
            case 'En evaluación': return 'warning';
            case 'No interesado': return 'danger';
            default: return 'default';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="visitas-premium-view">
            {/* Background Ornaments */}
            <div className="v-bg-blob blob-1" />
            <div className="v-bg-blob blob-2" />
            <div className="v-noise-overlay" />

            <PageHeader
                title="Registro de Visitas"
                description="Historial y seguimiento de actividad en campo por semana."
                icon={Navigation}
                breadcrumb={['Apps', 'Visitas']}
                actions={
                    <div className="v-master-controls">
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
                    </div>
                }
            />

            {/* Hero Stats */}
            <div className="stats-hero-grid">
                <PremiumCard className="hero-stat-card" hover={false}>
                    <div className="stat-icon-box main">
                        <MapPin size={24} />
                    </div>
                    <div className="stat-content">
                        <label>Visitas Totales</label>
                        <div className="value-row">
                            <span className="value">{stats.total}</span>
                            <span className="unit">REGISTROS</span>
                        </div>
                    </div>
                    <div className="stat-progress">
                        <div className="progress-bar" style={{ width: '100%' }}></div>
                    </div>
                </PremiumCard>

                <PremiumCard className="hero-stat-card assisted" hover={false}>
                    <div className="stat-icon-box gold">
                        <Users size={24} />
                    </div>
                    <div className="stat-content">
                        <label>Visitas Asistidas</label>
                        <div className="value-row">
                            <span className="value">{stats.assisted}</span>
                            <span className="unit">CON EQUIPO</span>
                        </div>
                    </div>
                    <div className="stat-progress">
                        <div className="progress-bar" style={{
                            width: `${(stats.assisted / (stats.total || 1)) * 100}%`,
                            background: 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                        }}></div>
                    </div>
                </PremiumCard>
            </div>

            {loading ? (
                <div className="loading-wrapper">
                    <LoadingSpinner message="Consultando reportes de visita..." />
                </div>
            ) : filteredVisitas.length === 0 ? (
                <EmptyState
                    icon={MapPin}
                    title="Sin visitas registradas"
                    message="No hay registros para los filtros seleccionados o selecciona una semana con actividad."
                />
            ) : (
                <div className="visitas-grid">
                    {filteredVisitas.map((v) => (
                        <PremiumCard key={v.id_visita} className="visita-card">
                            <div className="visit-header">
                                <div className="client-info">
                                    <div className="avatar">{(v.cliente?.nombre_cliente || 'C').charAt(0).toUpperCase()}</div>
                                    <div className="text">
                                        <span className="client-name">{v.cliente?.nombre_cliente || 'S/N'}</span>
                                        <span className="location">{v.distrito || 'Sin distrito'}</span>
                                    </div>
                                </div>
                                <Badge variant={getStatusVariant(v.resultado)}>{v.resultado}</Badge>
                            </div>

                            <div className="visit-body">
                                <p className="notes">{v.observaciones}</p>
                            </div>

                            {v.foto_url && (
                                <div className="visit-photo" onClick={() => setPreviewPhoto(`${BASE_URL}${v.foto_url}`)}>
                                    <img src={`${BASE_URL}${v.foto_url}`} alt="Visita" />
                                    <div className="overlay"><Eye size={20} /></div>
                                </div>
                            )}

                            <div className="visit-footer">
                                <div className="time">
                                    <Clock size={14} />
                                    <span>{formatDate(v.fecha_registro)}</span>
                                </div>
                                {user?.is_admin && (
                                    <button className="delete-btn" onClick={() => setDeleteConfirm(v.id_visita)}>
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </PremiumCard>
                    ))}
                </div>
            )}

            <ConfirmModal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="¿Eliminar visita?"
                message="Esta acción es irreversible y eliminará el registro del historial."
            />

            {previewPhoto && (
                <PhotoPreview url={previewPhoto} onClose={() => setPreviewPhoto(null)} />
            )}

            <style jsx>{`
                .visitas-premium-view { 
                    position: relative;
                    display: flex; 
                    flex-direction: column; 
                    gap: 2.5rem;
                    min-height: 100vh;
                    padding-bottom: 4rem;
                }

                /* Ornaments */
                .v-bg-blob {
                    position: fixed;
                    z-index: -2;
                    filter: blur(120px);
                    opacity: 0.1;
                    border-radius: 50%;
                }
                .blob-1 { top: -10%; right: -5%; width: 600px; height: 600px; background: var(--primary); }
                .blob-2 { bottom: -5%; left: -5%; width: 500px; height: 500px; background: #6366f1; }
                
                .v-noise-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: -1;
                    opacity: 0.02;
                    pointer-events: none;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
                }

                .v-master-controls {
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
                }

                .advisor-select-wrapper {
                    padding: 0 12px;
                    gap: 8px;
                    z-index: 101;
                    min-width: 220px;
                }
                .advisor-icon { color: var(--primary); display: flex; align-items: center; opacity: 0.8; }
                .advisor-select-minimal {
                    background: transparent;
                    border: none;
                    outline: none;
                    font-size: 0.85rem;
                    font-weight: 800;
                    color: var(--text-heading);
                    padding: 8px 10px 8px 4px;
                    cursor: pointer;
                    flex: 1;
                    min-width: 150px;
                }
                :global(.dark) .advisor-select-minimal { color: white; }
                .advisor-select-minimal option { background: white; color: black; }
                :global(.dark) .advisor-select-minimal option { background: #1e293b; color: white; }

                .tab-pill-group {
                    display: flex;
                    background: rgba(255, 255, 255, 0.4);
                    backdrop-filter: blur(10px);
                    padding: 4px;
                    border-radius: 16px;
                    border: 1px solid rgba(255, 255, 255, 0.5);
                    z-index: 10;
                    height: 48px;
                    align-items: center;
                }

                .pill-btn {
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 18px;
                    border-radius: 12px;
                    border: none;
                    background: transparent;
                    color: var(--text-muted);
                    font-size: 0.8rem;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    z-index: 1;
                }

                .pill-btn.active { color: white; }
                .pill-btn span { position: relative; z-index: 2; }
                :global(.pill-bg) {
                    position: absolute;
                    inset: 0;
                    background: var(--primary);
                    border-radius: 12px;
                    z-index: 1;
                    box-shadow: 0 4px 12px rgba(10, 132, 255, 0.3);
                }

                /* Stats Hero */
                .stats-hero-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.5rem;
                }
                :global(.hero-stat-card) {
                    padding: 1.5rem !important;
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    position: relative;
                    overflow: hidden;
                }
                .stat-icon-box {
                    width: 56px; height: 56px; border-radius: 16px;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .stat-icon-box.main { background: #eff6ff; color: #3b82f6; }
                .stat-icon-box.gold { background: #fffbeb; color: #f59e0b; }
                .stat-icon-box.blue { background: #f0f9ff; color: #0ea5e9; }
                
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

                /* Grid & Cards */
                .visitas-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); 
                    gap: 1.5rem; 
                }

                :global(.visita-card) { 
                    padding: 1.5rem !important; 
                    display: flex; 
                    flex-direction: column; 
                    gap: 1.25rem; 
                    border: 1px solid rgba(255,255,255,0.3);
                }
                
                .visit-header { display: flex; justify-content: space-between; align-items: flex-start; }
                .client-info { display: flex; align-items: center; gap: 12px; }
                .avatar {
                    width: 48px; height: 48px; border-radius: 14px; background: #f8fafc;
                    color: var(--primary); display: flex; align-items: center; justify-content: center;
                    font-weight: 800; border: 1px solid var(--border-subtle);
                    font-size: 1.2rem;
                }
                .text { display: flex; flex-direction: column; }
                .client-name { font-weight: 800; color: var(--text-heading); font-size: 1.05rem; letter-spacing: -0.01em; }
                .location { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }

                .visit-body { position: relative; }
                .notes { font-size: 0.95rem; color: var(--text-body); line-height: 1.6; margin: 0; opacity: 0.9; }

                .visit-photo {
                    position: relative; height: 200px; border-radius: 16px; overflow: hidden;
                    border: 1px solid var(--border-subtle); cursor: pointer;
                    box-shadow: var(--shadow-sm);
                }
                .visit-photo img { width: 100%; height: 100%; object-fit: cover; }
                .visit-photo .overlay {
                    position: absolute; inset: 0; background: rgba(15, 23, 42, 0.4);
                    display: flex; align-items: center; justify-content: center;
                    color: white; opacity: 0; transition: 0.3s;
                    backdrop-filter: blur(4px);
                }
                .visit-photo:hover .overlay { opacity: 1; }

                .visit-footer {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-top: auto; padding-top: 1.25rem; border-top: 1px solid #f1f5f9;
                }
                .time { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--text-muted); font-weight: 700; }
                
                .delete-btn {
                    width: 36px; height: 36px; border-radius: 10px; border: none;
                    background: #fff1f2; color: #ef4444; display: flex; align-items: center;
                    justify-content: center; cursor: pointer; transition: 0.2s;
                }
                .delete-btn:hover { background: #fee2e2; transform: scale(1.1); }

                /* Table */
                .table-card { padding: 0 !important; overflow: hidden; border: 1px solid rgba(255,255,255,0.3); }
                .elite-table { width: 100%; border-collapse: collapse; text-align: left; }
                .elite-table th {
                    padding: 1.25rem 1.5rem; background: #f8fafc; font-size: 0.75rem; 
                    font-weight: 800; color: var(--text-muted); text-transform: uppercase;
                    letter-spacing: 0.08em; border-bottom: 1px solid var(--border-subtle);
                }
                :global(.dark) .elite-table th { background: rgba(255,255,255,0.03); }
                .elite-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }

                .table-client-cell .name { font-weight: 800; color: var(--text-heading); font-size: 0.95rem; }
                .table-geo, .table-time { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: var(--text-body); font-weight: 600; }
                
                .table-actions { display: flex; gap: 8px; justify-content: flex-end; }
                .action-icon-btn {
                    width: 38px; height: 38px; border-radius: 12px; border: 1px solid var(--border-subtle);
                    display: flex; align-items: center; justify-content: center; background: white;
                    color: var(--text-muted); cursor: pointer; transition: all 0.2s;
                }
                .action-icon-btn:hover { border-color: var(--primary); color: var(--primary); transform: translateY(-2px); box-shadow: var(--shadow-sm); }
                .action-icon-btn.danger:hover { background: #fff1f2; color: #ef4444; border-color: #ef4444; }

                .loading-wrapper { padding: 8rem; display: flex; justify-content: center; width: 100%; }

                @media (max-width: 1280px) {
                    .stats-hero-grid { grid-template-columns: 1fr 1fr; }
                }

                @media (max-width: 1024px) {
                    .visitas-grid { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
                }

                @media (max-width: 768px) {
                    .stats-hero-grid { grid-template-columns: 1fr; }
                    .v-master-controls { justify-content: center; }
                }
            `}</style>
        </div>
    );
};

export default VisitaList;
