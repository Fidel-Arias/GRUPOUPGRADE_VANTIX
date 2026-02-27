import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PhoneCall,
    Mail,
    Plus,
    Calendar,
    Clock,
    Send,
    CheckCircle2,
    Activity,
    Phone
} from 'lucide-react';
import { crmService, planService, authService, empleadoService, BASE_URL } from '../../services/api';
import LlamadaModal from './LlamadaModal';
import EmailModal from './EmailModal';
import PageHeader from '../Common/PageHeader';
import PremiumCard from '../Common/PremiumCard';
import Badge from '../Common/Badge';
import LoadingSpinner from '../Common/LoadingSpinner';
import EmptyState from '../Common/EmptyState';
import PhotoPreview from '../Common/PhotoPreview';
import WeekPicker from '../Common/WeekPicker';

const CRMList = () => {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('llamadas'); // 'llamadas' o 'emails'
    const [llamadas, setLlamadas] = useState([]);
    const [emails, setEmails] = useState([]);
    const [plans, setPlans] = useState([]);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingAdvisors, setLoadingAdvisors] = useState(false);
    const [previewPhoto, setPreviewPhoto] = useState(null);
    const [advisors, setAdvisors] = useState([]);
    const [selectedAdvisorId, setSelectedAdvisorId] = useState(null);

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
            // Pre-fill with current user while we fetch everyone else
            setAdvisors([currentUser]);
            setSelectedAdvisorId(currentUser.id_empleado);

            const data = await empleadoService.getAll();
            if (data && data.length > 0) {
                setAdvisors(data);
            }

            if (currentUser.id_empleado) {
                fetchInitialData(currentUser.id_empleado);
            }
        } catch (error) {
            console.error('Error fetching advisors:', error);
            // Fallback: at least show the current user
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
        try {
            setLoading(true);
            setLlamadas([]);
            setEmails([]);
            setPlans([]);
            setSelectedPlanId('');

            const planesData = await planService.getAll(0, 50, empId);
            setPlans(planesData);

            if (planesData.length > 0) {
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const day = today.getDay() || 7;
                const monday = new Date(today);
                monday.setDate(today.getDate() - day + 1);
                const mondayStr = monday.toISOString().split('T')[0];

                const currentPlan = planesData.find(p => p.fecha_inicio_semana.startsWith(mondayStr));

                if (currentPlan) {
                    setSelectedPlanId(currentPlan.id_plan);
                    await fetchData(currentPlan.id_plan);
                } else {
                    setSelectedPlanId(planesData[0].id_plan);
                    await fetchData(planesData[0].id_plan);
                }
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Error fetching CRM data:', error);
            setLoading(false);
        }
    };

    const fetchData = async (planId) => {
        try {
            setLoading(true);
            const targetPlan = planId || selectedPlanId;
            if (!targetPlan) {
                setLoading(false);
                return;
            }

            if (activeTab === 'llamadas') {
                const data = await crmService.getLlamadas(targetPlan);
                setLlamadas(data);
            } else {
                const data = await crmService.getEmails(targetPlan);
                setEmails(data);
            }
        } catch (error) {
            console.error('Error fetching activity:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedPlanId) {
            fetchData(selectedPlanId);
        }
    }, [activeTab]);

    const handlePlanChange = (planId) => {
        setSelectedPlanId(planId);
        if (planId) {
            fetchData(planId);
        } else {
            setLlamadas([]);
            setEmails([]);
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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const filteredData = activeTab === 'llamadas' ? llamadas : emails;

    // Estadísticas rápidas con lógica de progreso
    const stats = {
        total: filteredData.length,
        uniqueClients: new Set(filteredData.map(d => d.nombre_destinatario || d.email_destino)).size,
        withEvidence: filteredData.filter(d => !!d.evidencia_url).length,
        avgDuration: activeTab === 'llamadas'
            ? Math.round(llamadas.reduce((acc, curr) => acc + (curr.duracion_segundos || 0), 0) / (llamadas.length || 1))
            : 0
    };

    const evidencePercentage = Math.round((stats.withEvidence / (stats.total || 1)) * 100);

    return (
        <div className="crm-premium-view">
            {/* Background Ornaments */}
            <div className="crm-bg-blob blob-1" />
            <div className="crm-bg-blob blob-2" />
            <div className="crm-noise-overlay" />

            <PageHeader
                title="Actividad Comercial"
                description="Auditoría de interacciones estratégicas en tiempo real."
                icon={Activity}
                breadcrumb={['Apps', 'CRM', activeTab === 'llamadas' ? 'Llama' : 'Mail']}
                actions={
                    <div className="crm-master-controls">
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
                        <div className="tab-pill-group">
                            <button
                                className={`pill-btn ${activeTab === 'llamadas' ? 'active' : ''}`}
                                onClick={() => setActiveTab('llamadas')}
                            >
                                <Phone size={14} /> <span>Llamadas</span>
                                {activeTab === 'llamadas' && <motion.div layoutId="active-pill" className="pill-bg" />}
                            </button>
                            <button
                                className={`pill-btn ${activeTab === 'emails' ? 'active' : ''}`}
                                onClick={() => setActiveTab('emails')}
                            >
                                <Mail size={14} /> <span>Emails</span>
                                {activeTab === 'emails' && <motion.div layoutId="active-pill" className="pill-bg" />}
                            </button>
                        </div>
                    </div>
                }
            />

            <div className="crm-dashboard-layout">
                {/* Single Hero Stat - Clean & Executable */}
                <div className="crm-hero-stat-container">
                    <motion.div
                        className="activity-summary-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="summary-icon-box">
                            {activeTab === 'llamadas' ? <PhoneCall size={28} /> : <Mail size={28} />}
                        </div>
                        <div className="summary-content">
                            <span className="summary-label">Registros Semanales</span>
                            <div className="summary-main">
                                <span className="summary-value">{stats.total}</span>
                                <span className="summary-subline">
                                    {activeTab === 'llamadas' ? 'Llamadas realizadas' : 'Emails enviados'} en este periodo
                                </span>
                            </div>
                        </div>
                        <div className="summary-visual-ornament" />
                    </motion.div>
                </div>

                <div className="crm-grid-wrapper">
                    {loading ? (
                        <div className="crm-loading-state">
                            <LoadingSpinner message="Consultando actividad comercial..." />
                        </div>
                    ) : filteredData.length === 0 ? (
                        <motion.div
                            className="crm-empty-lux"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <div className="empty-icon-ring">
                                <Activity size={40} className="pulse-icon" />
                            </div>
                            <h3>Sin registros esta semana</h3>
                            <p>No se ha detectado actividad comercial. Puede seleccionar una semana anterior para revisar el histórico.</p>
                        </motion.div>
                    ) : (
                        <div className="crm-ultra-grid">
                            <AnimatePresence mode="popLayout">
                                {filteredData.map((item, index) => (
                                    <motion.div
                                        key={item.id_llamada || item.id_email}
                                        layout
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.5, delay: index * 0.05 }}
                                    >
                                        <div className="lux-card">
                                            <div className="lux-card-glow" />
                                            <div className="lux-header">
                                                <div className="client-info-v3">
                                                    <div className="client-avatar-v3">
                                                        {(item.nombre_destinatario || item.email_destino || 'U').charAt(0).toUpperCase()}
                                                        <div className="status-dot-v3" />
                                                    </div>
                                                    <div className="client-txt-v3">
                                                        <h4>{item.nombre_destinatario || 'Cliente Corporativo'}</h4>
                                                        <span>{item.numero_destino || item.email_destino}</span>
                                                    </div>
                                                </div>
                                                <div className={`lux-badge ${activeTab}`}>
                                                    {activeTab === 'llamadas' ? <PhoneCall size={12} /> : <Mail size={12} />}
                                                </div>
                                            </div>

                                            <div className="lux-body">
                                                {activeTab === 'emails' && item.asunto && (
                                                    <div className="lux-subject">
                                                        <div className="sub-tag">ASUNTO</div>
                                                        <p>{item.asunto}</p>
                                                    </div>
                                                )}
                                                <div className="lux-notes-box">
                                                    <p>{item.notas || item.cuerpo_email}</p>
                                                </div>
                                            </div>

                                            {item.evidencia_url && (
                                                <div className="lux-evidence" onClick={() => setPreviewPhoto(`${BASE_URL}${item.evidencia_url}`)}>
                                                    <img src={`${BASE_URL}${item.evidencia_url}`} alt="Evidencia de auditoría" />
                                                    <div className="lux-overlay">
                                                        <Plus size={24} className="zoom-ico" />
                                                        <span>AUDITORÍA</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="lux-footer">
                                                <div className="lux-time">
                                                    <Clock size={12} />
                                                    <span>{formatDate(item.fecha_registro)}</span>
                                                </div>
                                                {item.duracion_segundos && (
                                                    <div className="lux-duration">
                                                        {Math.floor(item.duracion_segundos / 60)}:{String(item.duracion_segundos % 60).padStart(2, '0')} min
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {previewPhoto && (
                <PhotoPreview
                    url={previewPhoto}
                    onClose={() => setPreviewPhoto(null)}
                />
            )}

            <style jsx>{`
                .crm-premium-view { 
                    position: relative;
                    display: flex; 
                    flex-direction: column; 
                    gap: 2rem;
                    min-height: 100vh;
                    padding-bottom: 4rem;
                }

                /* Ornaments */
                .crm-bg-blob {
                    position: fixed;
                    z-index: -2;
                    filter: blur(120px);
                    opacity: 0.15;
                    border-radius: 50%;
                }
                .blob-1 { top: -10%; right: -5%; width: 600px; height: 600px; background: var(--primary); }
                .blob-2 { bottom: -5%; left: -5%; width: 500px; height: 500px; background: #6366f1; }
                
                .crm-noise-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: -1;
                    opacity: 0.025;
                    pointer-events: none;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
                }

                .crm-master-controls {
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
                    gap: 8px;
                    padding: 8px 18px;
                    border: none;
                    background: transparent;
                    color: var(--text-muted);
                    font-size: 0.8rem;
                    font-weight: 800;
                    cursor: pointer;
                    z-index: 1;
                    transition: color 0.3s;
                }
                .pill-btn.active { color: white; }
                .pill-bg {
                    position: absolute;
                    inset: 0;
                    background: var(--primary);
                    border-radius: 10px;
                    box-shadow: 0 4px 12px var(--primary-shadow);
                    z-index: -1;
                }

                /* Hero Stat */
                .crm-hero-stat-container {
                    margin-bottom: 2rem;
                }

                .activity-summary-card {
                    position: relative;
                    background: white;
                    border: 1px solid var(--border-subtle);
                    border-radius: 28px;
                    padding: 2rem;
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.03);
                    overflow: hidden;
                }
                :global(.dark) .activity-summary-card { background: var(--bg-panel); border-color: var(--border-light); }

                .summary-icon-box {
                    width: 70px; height: 70px; border-radius: 20px;
                    background: var(--primary-glow); color: var(--primary);
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }

                .summary-content { display: flex; flex-direction: column; gap: 4px; }
                .summary-label { font-size: 0.75rem; font-weight: 950; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; }
                .summary-main { display: flex; align-items: baseline; gap: 12px; }
                .summary-value { font-size: 2.5rem; font-weight: 950; color: var(--text-heading); letter-spacing: -0.05em; }
                .summary-subline { font-size: 0.9rem; font-weight: 700; color: var(--text-muted); }

                .summary-visual-ornament {
                    position: absolute; right: -20px; top: -20px; width: 150px; height: 150px;
                    background: radial-gradient(circle, var(--primary-glow) 0%, transparent 70%);
                    opacity: 0.5; pointer-events: none;
                }

                /* Grid Luxe */
                .crm-ultra-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
                    gap: 1.5rem;
                }

                .lux-card {
                    position: relative;
                    background: white;
                    border: 1px solid var(--border-subtle);
                    border-radius: 24px;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
                }
                :global(.dark) .lux-card { background: var(--bg-panel); border-color: var(--border-light); }

                .lux-card-glow {
                    position: absolute; top: 0; right: 0; width: 60px; height: 60px;
                    background: radial-gradient(circle, var(--primary-glow) 0%, transparent 70%);
                    opacity: 0; transition: opacity 0.4s;
                }
                .lux-card:hover { 
                    transform: translateY(-8px);
                    box-shadow: 0 20px 40px -8px rgba(0,0,0,0.08); 
                    border-color: var(--primary-soft);
                }
                .lux-card:hover .lux-card-glow { opacity: 1; }

                .lux-header { display: flex; justify-content: space-between; align-items: flex-start; }
                .client-info-v3 { display: flex; align-items: center; gap: 12px; }
                
                .client-avatar-v3 {
                    position: relative;
                    width: 52px; height: 52px; border-radius: 16px;
                    background: linear-gradient(135deg, #f8fafc, #e2e8f0);
                    color: var(--primary); font-weight: 950; font-size: 1.25rem;
                    display: flex; align-items: center; justify-content: center;
                    border: 1.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.05);
                }
                .status-dot-v3 {
                    position: absolute; bottom: -2px; right: -2px; width: 12px; height: 12px;
                    background: #10b981; border: 2px solid white; border-radius: 50%;
                }

                .client-txt-v3 h4 { font-size: 1.05rem; font-weight: 900; color: var(--text-heading); line-height: 1.2; }
                .client-txt-v3 span { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }

                .lux-badge { padding: 10px; border-radius: 12px; }
                .lux-badge.llamadas { background: #e0f2fe; color: var(--primary); }
                .lux-badge.emails { background: #dcfce7; color: #059669; }

                .lux-body { display: flex; flex-direction: column; gap: 10px; }
                .lux-subject { 
                    padding: 0.75rem; background: #f8fafc; border-radius: 12px; 
                    border: 1px solid #f1f5f9; display: flex; flex-direction: column; gap: 2px;
                }
                .lux-subject p { font-size: 0.85rem; font-weight: 800; color: var(--text-heading); margin: 0; }

                .lux-notes-box p { font-size: 0.95rem; line-height: 1.6; color: var(--text-body); margin: 0; opacity: 0.9; }

                .lux-evidence {
                    position: relative; height: 180px; border-radius: 18px; overflow: hidden;
                    border: 1px solid var(--border-subtle); cursor: pointer;
                }
                .lux-evidence img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
                .lux-overlay {
                    position: absolute; inset: 0; background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(4px); display: flex; flex-direction: column;
                    align-items: center; justify-content: center; gap: 8px;
                    color: white; opacity: 0; transition: 0.3s;
                }
                .lux-overlay span { font-size: 0.75rem; font-weight: 950; letter-spacing: 0.2rem; }
                .lux-evidence:hover img { transform: scale(1.08); }
                .lux-evidence:hover .lux-overlay { opacity: 1; }

                .lux-footer {
                    display: flex; justify-content: space-between; align-items: center;
                    padding-top: 1.25rem; border-top: 1px dashed var(--border-light);
                }
                .lux-time { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--text-muted); font-weight: 700; }
                .lux-duration { 
                    font-size: 0.75rem; font-weight: 950; color: var(--primary); 
                    background: var(--primary-glow); padding: 4px 12px; border-radius: 8px;
                }

                .crm-empty-lux {
                    padding: 8rem 2rem; display: flex; flex-direction: column; align-items: center;
                    text-align: center; background: white; border-radius: 40px; border: 1px dashed var(--border-subtle);
                }
                .crm-loading-state { padding: 8rem 0; display: flex; justify-content: center; width: 100%; }

                @media (max-width: 768px) {
                    .crm-master-controls { flex-direction: column; align-items: stretch; }
                    .activity-summary-card { flex-direction: column; text-align: center; padding: 1.5rem; }
                    .summary-main { justify-content: center; }
                    .crm-ultra-grid { grid-template-columns: 1fr; }
                    .pill-btn span { display: none; }
                }
            `}</style>
        </div>
    );
};

export default CRMList;
