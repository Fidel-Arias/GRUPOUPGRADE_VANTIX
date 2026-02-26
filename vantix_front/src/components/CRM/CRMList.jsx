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
import { crmService, BASE_URL } from '../../services/api';
import LlamadaModal from './LlamadaModal';
import EmailModal from './EmailModal';
import PageHeader from '../Common/PageHeader';
import PremiumCard from '../Common/PremiumCard';
import Badge from '../Common/Badge';
import SearchInput from '../Common/SearchInput';
import LoadingSpinner from '../Common/LoadingSpinner';
import EmptyState from '../Common/EmptyState';
import PhotoPreview from '../Common/PhotoPreview';

const CRMList = () => {
    const [activeTab, setActiveTab] = useState('llamadas'); // 'llamadas' o 'emails'
    const [llamadas, setLlamadas] = useState([]);
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [previewPhoto, setPreviewPhoto] = useState(null);

    // Estados para modales
    const [isLlamadaModalOpen, setIsLlamadaModalOpen] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        try {
            setLoading(true);
            if (activeTab === 'llamadas') {
                const data = await crmService.getLlamadas();
                setLlamadas(data);
            } else {
                const data = await crmService.getEmails();
                setEmails(data);
            }
        } catch (error) {
            console.error('Error fetching CRM data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveLlamada = async (data) => {
        await crmService.registrarLlamada(data);
        fetchData();
    };

    const handleSaveEmail = async (data) => {
        await crmService.registrarEmail(data);
        fetchData();
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const filteredData = activeTab === 'llamadas'
        ? llamadas.filter(l => l.numero_destino.includes(searchTerm) || l.nombre_destinatario?.toLowerCase().includes(searchTerm.toLowerCase()))
        : emails.filter(e => e.email_destino.toLowerCase().includes(searchTerm.toLowerCase()) || e.asunto?.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="crm-container">
            <PageHeader
                title="Actividad Comercial"
                description="Auditoría y registro de interacciones en tiempo real."
                icon={Activity}
                breadcrumb={['Apps', 'CRM', activeTab === 'llamadas' ? 'Llamadas' : 'Emails']}
                actions={
                    <div className="tab-switcher">
                        <button
                            className={activeTab === 'llamadas' ? 'active' : ''}
                            onClick={() => setActiveTab('llamadas')}
                        >
                            <Phone size={16} /> Llamadas
                        </button>
                        <button
                            className={activeTab === 'emails' ? 'active' : ''}
                            onClick={() => setActiveTab('emails')}
                        >
                            <Mail size={16} /> Emails
                        </button>
                    </div>
                }
            />

            <PremiumCard className="control-bar" hover={false}>
                <div className="search-group">
                    <SearchInput
                        placeholder={activeTab === 'llamadas' ? "Buscar número o nombre..." : "Buscar destinatario o asunto..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    className="btn-new-activity"
                    onClick={() => activeTab === 'llamadas' ? setIsLlamadaModalOpen(true) : setIsEmailModalOpen(true)}
                >
                    <Plus size={20} />
                    <span>Registrar {activeTab === 'llamadas' ? 'Llamada' : 'Email'}</span>
                </button>
            </PremiumCard>

            <div className="activity-grid">
                {loading ? (
                    <div className="loading-wrapper">
                        <LoadingSpinner message="Obteniendo registros de interacción..." />
                    </div>
                ) : filteredData.length === 0 ? (
                    <EmptyState
                        icon={activeTab === 'llamadas' ? PhoneCall : Send}
                        title="Sin registros"
                        message={`No se han detectado ${activeTab} en el periodo actual.`}
                    />
                ) : (
                    filteredData.map((item) => (
                        <PremiumCard key={item.id_llamada || item.id_email} className="activity-card">
                            <div className="card-top">
                                <div className="user-info">
                                    <div className="avatar">
                                        {(item.nombre_destinatario || item.email_destino || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="text">
                                        <span className="name">{item.nombre_destinatario || 'Cliente Corporativo'}</span>
                                        <span className="sub">{item.numero_destino || item.email_destino}</span>
                                    </div>
                                </div>
                                <Badge variant={activeTab === 'llamadas' ? 'info' : 'success'}>
                                    {activeTab === 'llamadas' ? <Phone size={12} /> : <Mail size={12} />}
                                    {activeTab === 'llamadas' ? 'CALL' : 'EMAIL'}
                                </Badge>
                            </div>

                            <div className="card-middle">
                                {activeTab === 'emails' && (
                                    <div className="email-meta">
                                        <strong>Asunto:</strong> {item.asunto}
                                    </div>
                                )}
                                <p className="notes">{item.notas || item.cuerpo_email}</p>
                            </div>

                            {item.evidencia_url && (
                                <div className="card-evidence" onClick={() => setPreviewPhoto(`${BASE_URL}${item.evidencia_url}`)}>
                                    <img src={`${BASE_URL}${item.evidencia_url}`} alt="Evidencia" />
                                    <div className="overlay">Ver Captura de Pantalla</div>
                                </div>
                            )}

                            <div className="card-footer">
                                <div className="time">
                                    <Clock size={14} />
                                    <span>{formatDate(item.fecha_registro)}</span>
                                </div>
                                {item.duracion_segundos && (
                                    <div className="meta">
                                        <span>{Math.floor(item.duracion_segundos / 60)}m {item.duracion_segundos % 60}s</span>
                                    </div>
                                )}
                            </div>
                        </PremiumCard>
                    ))
                )}
            </div>

            <LlamadaModal
                isOpen={isLlamadaModalOpen}
                onClose={() => setIsLlamadaModalOpen(false)}
                onSave={handleSaveLlamada}
            />

            <EmailModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                onSave={handleSaveEmail}
            />

            {previewPhoto && (
                <PhotoPreview
                    url={previewPhoto}
                    onClose={() => setPreviewPhoto(null)}
                />
            )}

            <style jsx>{`
                .crm-container { display: flex; flex-direction: column; gap: 1.5rem; }

                .tab-switcher {
                    display: flex; gap: 8px; padding: 6px; background: white;
                    border: 1px solid var(--border-subtle); border-radius: 12px;
                }
                :global(.dark) .tab-switcher { background: var(--bg-panel); border-color: var(--border-light); }

                .tab-switcher button {
                    display: flex; align-items: center; gap: 10px; padding: 10px 20px;
                    border: none; background: transparent; color: var(--text-muted);
                    font-weight: 800; font-size: 0.85rem; cursor: pointer; transition: all 0.2s;
                    border-radius: 8px;
                }
                .tab-switcher button.active { background: var(--bg-sidebar); color: white; }

                .control-bar { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1.25rem; }
                .search-group { flex: 1; max-width: 400px; }

                .btn-new-activity {
                    display: flex; align-items: center; gap: 10px; padding: 0.8rem 1.5rem;
                    background: var(--primary); color: white; border/none; border-radius: 12px;
                    font-weight: 700; cursor: pointer; transition: all 0.2s;
                }
                .btn-new-activity:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); opacity: 0.9; }

                .activity-grid {
                    display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 1.5rem;
                }

                :global(.activity-card) { padding: 1.5rem !important; display: flex; flex-direction: column; gap: 1.25rem; }
                
                .card-top { display: flex; justify-content: space-between; align-items: flex-start; }
                .user-info { display: flex; align-items: center; gap: 12px; }
                .avatar {
                    width: 44px; height: 44px; border-radius: 12px; background: var(--bg-app);
                    color: var(--primary); display: flex; align-items: center; justify-content: center;
                    font-weight: 800; border: 1px solid var(--border-subtle);
                }
                .text { display: flex; flex-direction: column; }
                .name { font-weight: 800; color: var(--text-heading); font-size: 1rem; }
                .sub { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }

                .notes { font-size: 0.9rem; color: var(--text-body); line-height: 1.6; margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
                .email-meta { font-size: 0.85rem; color: var(--text-heading); margin-bottom: 8px; border-bottom: 1px dashed var(--border-light); padding-bottom: 8px; }

                .card-evidence {
                    position: relative; height: 160px; border-radius: 12px; overflow: hidden;
                    border: 1px solid var(--border-subtle); cursor: pointer;
                }
                .card-evidence img { width: 100%; height: 100%; object-fit: cover; }
                .card-evidence .overlay {
                    position: absolute; inset: 0; background: rgba(0,0,0,0.4);
                    display: flex; align-items: center; justify-content: center;
                    color: white; font-weight: 700; font-size: 0.8rem; opacity: 0; transition: 0.2s;
                }
                .card-evidence:hover .overlay { opacity: 1; }

                .card-footer {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-top: auto; padding-top: 1.25rem; border-top: 1px solid var(--border-light);
                }
                .time { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }
                .meta { font-size: 0.75rem; font-weight: 800; color: var(--primary); background: var(--primary-glow); padding: 4px 8px; border-radius: 6px; }

                .loading-wrapper { grid-column: 1 / -1; padding: 5rem; display: flex; justify-content: center; }

                @media (max-width: 768px) {
                    .control-bar { flex-direction: column; align-items: stretch; gap: 1rem; }
                    .tab-switcher { width: 100%; overflow-x: auto; }
                    .tab-switcher button { flex: 1; justify-content: center; }
                    .activity-grid { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
};

export default CRMList;
