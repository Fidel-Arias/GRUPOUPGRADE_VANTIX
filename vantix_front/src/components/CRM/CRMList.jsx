import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PhoneCall,
    Mail,
    Plus,
    Calendar,
    Clock,
    Send,
    CheckCircle2
} from 'lucide-react';
import { crmService, BASE_URL } from '../../services/api';
import LlamadaModal from './LlamadaModal';
import EmailModal from './EmailModal';
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
            <div className="section-header">
                <div className="title-group">
                    <div className="header-decoration"></div>
                    <h2>Actividad Comercial</h2>
                    <p>Auditoría y registro de interacciones en tiempo real.</p>
                </div>
                <div className="tab-switcher">
                    <button
                        className={activeTab === 'llamadas' ? 'active' : ''}
                        onClick={() => setActiveTab('llamadas')}
                    >
                        <PhoneCall size={16} /> Llamadas
                    </button>
                    <button
                        className={activeTab === 'emails' ? 'active' : ''}
                        onClick={() => setActiveTab('emails')}
                    >
                        <Mail size={16} /> Emails
                    </button>
                </div>
            </div>

            <PremiumCard className="control-bar" hover={false}>
                <div className="search-wrap">
                    <SearchInput
                        placeholder={activeTab === 'llamadas' ? "Buscar por número o nombre..." : "Buscar por email o asunto..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    className="btn-action-premium"
                    onClick={() => activeTab === 'llamadas' ? setIsLlamadaModalOpen(true) : setIsEmailModalOpen(true)}
                >
                    <Plus size={20} />
                    <span className="btn-text">{activeTab === 'llamadas' ? 'Registrar Llamada' : 'Registrar Email'}</span>
                </button>
            </PremiumCard>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="crm-content"
                >
                    {loading ? (
                        <div className="loader-container">
                            <LoadingSpinner message="Sincronizando con el servidor..." />
                        </div>
                    ) : filteredData.length === 0 ? (
                        <EmptyState
                            icon={activeTab === 'llamadas' ? PhoneCall : Mail}
                            title={activeTab === 'llamadas' ? "Sin historial de llamadas" : "Sin historial de correos"}
                            message={`No se han detectado registros de ${activeTab} que coincidan con los criterios de búsqueda.`}
                            actionLabel="Registrar actividad"
                            onAction={() => activeTab === 'llamadas' ? setIsLlamadaModalOpen(true) : setIsEmailModalOpen(true)}
                        />
                    ) : (
                        <div className="crm-grid">
                            {filteredData.map((item, idx) => (
                                <motion.div
                                    key={activeTab === 'llamadas' ? item.id_llamada : item.id_email}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <PremiumCard className="crm-card-premium" hover={true}>
                                        <div className="card-top-info">
                                            <div className={`type-icon-box ${activeTab}`}>
                                                {activeTab === 'llamadas' ? <PhoneCall size={20} /> : <Mail size={20} />}
                                            </div>
                                            <div className="main-meta">
                                                <h4>{activeTab === 'llamadas' ? item.nombre_destinatario || item.numero_destino : item.email_destino}</h4>
                                                <div className="date-pill">
                                                    <Clock size={12} />
                                                    <span>{formatDate(item.fecha_hora)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="card-middle">
                                            <div className="status-row">
                                                {activeTab === 'llamadas' ? (
                                                    <>
                                                        <span className="duration-tag">{item.duracion_segundos}s de duración</span>
                                                        <Badge variant={item.resultado === 'Éxitosa' ? 'success' : 'warning'}>
                                                            {item.resultado}
                                                        </Badge>
                                                    </>
                                                ) : (
                                                    <Badge variant="info">
                                                        {item.estado_envio || 'Enviado'}
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="content-preview">
                                                {activeTab === 'emails' && <div className="subject-line"><strong>Asunto:</strong> {item.asunto}</div>}
                                                <p className="description-text">
                                                    {activeTab === 'llamadas' ? item.notas_llamada : item.cuerpo?.substring(0, 100) + '...'}
                                                </p>
                                            </div>

                                            {item.url_foto_prueba && (
                                                <div className="evidence-preview" onClick={() => setPreviewPhoto(`${BASE_URL}${item.url_foto_prueba}`)}>
                                                    <img src={`${BASE_URL}${item.url_foto_prueba}`} alt="Evidencia" />
                                                    <div className="img-overlay">Ver evidencia digital</div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="card-bottom">
                                            <div className="ref-badge">
                                                <div className="ref-dot"></div>
                                                <span>Referencia Plan: #{item.id_plan}</span>
                                            </div>
                                            <button className="btn-detail-link">
                                                Detalles <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    </PremiumCard>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>


            <style jsx>{`
                .crm-container { max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; gap: 2rem; }
                
                .section-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 0.5rem; }
                .header-decoration { width: 40px; height: 4px; background: var(--primary); border-radius: 2px; margin-bottom: 0.75rem; }
                .title-group h2 { font-size: 2rem; font-weight: 800; color: var(--text-heading); margin: 0; letter-spacing: -0.04em; }
                .title-group p { color: var(--text-muted); font-size: 1rem; font-weight: 500; margin-top: 4px; }

                .tab-switcher { 
                    display: flex; background: var(--bg-panel); padding: 5px; border-radius: 14px;
                    border: 1px solid var(--border-subtle); box-shadow: var(--shadow-sm); gap: 5px;
                }
                .tab-switcher button {
                    display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 10px;
                    border: none; background: transparent; color: var(--text-muted); font-weight: 700;
                    font-size: 0.9rem; cursor: pointer; transition: 0.2s;
                }
                .tab-switcher button.active { background: var(--bg-sidebar); color: white; box-shadow: var(--shadow-md); }
                .tab-switcher button:not(.active):hover { color: var(--primary); background: var(--bg-app); }

                .control-bar { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 2rem; gap: 2rem; }
                .search-wrap { flex: 1; }

                .btn-action-premium {
                    display: flex; align-items: center; gap: 10px; padding: 0 1.5rem; height: 48px;
                    background: var(--bg-sidebar); color: white; border-radius: 12px; border: none;
                    font-weight: 700; cursor: pointer; transition: 0.3s; box-shadow: var(--shadow-md);
                }
                .btn-action-premium:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); background: #0f172a; }

                .crm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 2rem; }
                
                .crm-card-premium { padding: 1.75rem; display: flex; flex-direction: column; gap: 1.5rem; height: 100%; border: 1px solid var(--border-subtle); }
                .card-top-info { display: flex; align-items: center; gap: 1.25rem; }
                
                .type-icon-box { 
                    width: 52px; height: 52px; border-radius: 16px; display: flex; align-items: center; justify-content: center;
                    box-shadow: inset 0 0 10px rgba(0,0,0,0.05);
                }
                .type-icon-box.llamadas { background: var(--primary-glow); color: var(--primary); }
                .type-icon-box.emails { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

                .main-meta h4 { font-size: 1.1rem; font-weight: 800; color: var(--text-heading); margin: 0; }
                .date-pill { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-top: 4px; }

                .status-row { display: flex; align-items: center; gap: 1rem; }
                .duration-tag { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); background: var(--bg-app); padding: 4px 10px; border-radius: 8px; }

                .content-preview { background: var(--bg-app); padding: 1.25rem; border-radius: 16px; border: 1px solid var(--border-subtle); }
                .subject-line { font-size: 0.85rem; color: var(--text-heading); margin-bottom: 6px; }
                .description-text { font-size: 0.9rem; color: var(--text-body); line-height: 1.6; margin: 0; font-weight: 500; }

                .evidence-preview { 
                    position: relative; border-radius: 16px; overflow: hidden; height: 140px; 
                    border: 1px solid var(--border-subtle); cursor: pointer; margin-top: 1rem; 
                }
                .evidence-preview img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
                .img-overlay { 
                    position: absolute; inset: 0; background: rgba(0,0,0,0.4); color: white; font-weight: 700;
                    display: flex; align-items: center; justify-content: center; font-size: 0.8rem; opacity: 0; transition: 0.3s;
                }
                .evidence-preview:hover img { transform: scale(1.1); }
                .evidence-preview:hover .img-overlay { opacity: 1; }

                .card-bottom { 
                    margin-top: auto; padding-top: 1.25rem; border-top: 1px solid var(--border-subtle); 
                    display: flex; justify-content: space-between; align-items: center; 
                }
                .ref-badge { display: flex; align-items: center; gap: 8px; }
                .ref-dot { width: 8px; height: 8px; background: var(--primary); border-radius: 50%; box-shadow: 0 0 10px var(--primary); }
                .ref-badge span { font-size: 0.7rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }

                .btn-detail-link { 
                    background: transparent; border: none; color: var(--primary); font-weight: 800; 
                    font-size: 0.85rem; display: flex; align-items: center; gap: 6px; cursor: pointer; transition: 0.2s;
                }
                .btn-detail-link:hover { transform: translateX(4px); text-decoration: underline; }

                .loader-container { height: 400px; display: flex; align-items: center; justify-content: center; }

                @media (max-width: 1024px) {
                    .section-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
                    .tab-switcher { width: 100%; }
                    .tab-switcher button { flex: 1; justify-content: center; }
                    .control-bar { flex-direction: column; gap: 1rem; align-items: stretch; }
                }

                @media (max-width: 640px) {
                    .crm-grid { grid-template-columns: 1fr; }
                    .btn-text { display: none; }
                    .btn-action-premium { width: 56px; height: 56px; border-radius: 50%; padding: 0; justify-content: center; position: fixed; bottom: 2rem; right: 2rem; z-index: 100; }
                }
            `}</style>
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
            <PhotoPreview
                url={previewPhoto}
                isOpen={!!previewPhoto}
                onClose={() => setPreviewPhoto(null)}
            />
        </div>
    );
};

export default CRMList;
