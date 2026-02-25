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
                    <h2>CRM Automático</h2>
                    <p>Auditoría y registro de interacciones comerciales.</p>
                </div>
                <div className="tab-switcher card-premium">
                    <button className={activeTab === 'llamadas' ? 'active' : ''} onClick={() => setActiveTab('llamadas')}>
                        <PhoneCall size={16} /> Llamadas
                    </button>
                    <button className={activeTab === 'emails' ? 'active' : ''} onClick={() => setActiveTab('emails')}>
                        <Mail size={16} /> Emails
                    </button>
                </div>
            </div>

            <PremiumCard className="control-bar" hover={false}>
                <SearchInput
                    placeholder={activeTab === 'llamadas' ? "Buscar por número o nombre..." : "Buscar por email o asunto..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                    className="btn-primary"
                    onClick={() => activeTab === 'llamadas' ? setIsLlamadaModalOpen(true) : setIsEmailModalOpen(true)}
                >
                    <Plus size={18} />
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
                        <LoadingSpinner message="Sincronizando registros..." />
                    ) : filteredData.length === 0 ? (
                        <EmptyState
                            icon={activeTab === 'llamadas' ? PhoneCall : Mail}
                            title={`Sin ${activeTab}`}
                            message={`No se encontraron registros de ${activeTab} en este periodo.`}
                            actionLabel="Registrar Ahora"
                            onAction={() => activeTab === 'llamadas' ? setIsLlamadaModalOpen(true) : setIsEmailModalOpen(true)}
                        />
                    ) : (
                        <div className="crm-grid">
                            {filteredData.map((item) => (
                                <PremiumCard
                                    key={activeTab === 'llamadas' ? item.id_llamada : item.id_email}
                                    className="crm-card"
                                >
                                    <div className="card-header">
                                        <div className={`icon-indicator ${activeTab}`}>
                                            {activeTab === 'llamadas' ? <PhoneCall size={18} /> : <Mail size={18} />}
                                        </div>
                                        <div className="item-info">
                                            <h4>{activeTab === 'llamadas' ? item.nombre_destinatario || item.numero_destino : item.email_destino}</h4>
                                            <span>{formatDate(item.fecha_hora)}</span>
                                        </div>
                                    </div>

                                    <div className="card-body">
                                        <div className="meta-row">
                                            {activeTab === 'llamadas' ? (
                                                <>
                                                    <div className="meta-item"><Clock size={14} /> <span>{item.duracion_segundos}s</span></div>
                                                    <Badge variant={item.resultado === 'Éxitosa' ? 'success' : 'warning'}>{item.resultado}</Badge>
                                                </>
                                            ) : (
                                                <Badge variant="info" icon={Send}>{item.estado_envio}</Badge>
                                            )}
                                        </div>
                                        <p className="item-notes">
                                            {activeTab === 'emails' && <strong>Asunto: </strong>}
                                            {activeTab === 'llamadas' ? item.notas_llamada : item.asunto}
                                        </p>
                                        {item.url_foto_prueba && (
                                            <div className="proof-photo-wrapper">
                                                <img src={`${BASE_URL}${item.url_foto_prueba}`} alt="Prueba" onClick={() => setPreviewPhoto(`${BASE_URL}${item.url_foto_prueba}`)} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="card-footer">
                                        <div className="plan-badge">
                                            <Calendar size={12} />
                                            <span>Semana {item.id_plan}</span>
                                        </div>
                                    </div>
                                </PremiumCard>
                            ))}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            <LlamadaModal isOpen={isLlamadaModalOpen} onClose={() => setIsLlamadaModalOpen(false)} onSave={handleSaveLlamada} />
            <EmailModal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} onSave={handleSaveEmail} />
            <PhotoPreview url={previewPhoto} isOpen={!!previewPhoto} onClose={() => setPreviewPhoto(null)} />

            <style jsx>{`
                .crm-container { display: flex; flex-direction: column; gap: 1.5rem; animation: fadeIn 0.5s ease-out; }
                .section-header { display: flex; justify-content: space-between; align-items: center; }
                .title-group h2 { font-size: 1.8rem; font-weight: 800; color: var(--text-heading); letter-spacing: -0.02em; }
                .title-group p { color: var(--text-muted); font-size: 0.95rem; }
                
                .tab-switcher { display: flex; padding: 4px; border-radius: 12px; gap: 4px; background: var(--bg-app); border: 1px solid var(--border-subtle); }
                .tab-switcher button {
                    padding: 8px 16px; border-radius: 8px; border: none; background: transparent;
                    display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 700;
                    color: var(--text-muted); cursor: pointer; transition: all 0.2s;
                }
                .tab-switcher button.active { background: var(--bg-panel); color: var(--primary); box-shadow: var(--shadow-sm); }

                .control-bar { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; }
                
                .btn-primary { 
                    background: var(--bg-sidebar); color: white; border: none; padding: 0.75rem 1.25rem; border-radius: 12px;
                    display: flex; align-items: center; gap: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s;
                }
                .btn-primary:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); background: #0f172a; }

                .crm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
                .crm-card { display: flex; flex-direction: column; padding: 1.5rem; gap: 1rem; }
                
                .card-header { display: flex; gap: 12px; align-items: flex-start; }
                .icon-indicator { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
                .icon-indicator.llamadas { background: var(--primary-glow); color: var(--primary); }
                .icon-indicator.emails { background: rgba(219, 39, 119, 0.1); color: #db2777; }
                
                .item-info { display: flex; flex-direction: column; gap: 2px; }
                .item-info h4 { font-size: 0.95rem; font-weight: 800; color: var(--text-heading); }
                .item-info span { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }
                
                .meta-row { display: flex; align-items: center; gap: 1rem; margin-top: 0.5rem; }
                .meta-item { display: flex; align-items: center; gap: 5px; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); }
                
                .item-notes { font-size: 0.85rem; color: var(--text-body); line-height: 1.5; margin-top: 0.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                
                .proof-photo-wrapper { margin-top: 10px; border-radius: 12px; overflow: hidden; height: 100px; border: 1px solid var(--border-subtle); cursor: pointer; }
                .proof-photo-wrapper img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
                .proof-photo-wrapper img:hover { transform: scale(1.1); }

                .card-footer { margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; }
                .plan-badge { display: flex; align-items: center; gap: 4px; font-size: 0.7rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }

                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

                @media (max-width: 1024px) {
                    .section-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
                    .tab-switcher { width: 100%; }
                    .tab-switcher button { flex: 1; justify-content: center; }
                    .control-bar { flex-direction: column; gap: 1rem; align-items: stretch; }
                }

                @media (max-width: 640px) {
                    .title-group h2 { font-size: 1.5rem; }
                    .btn-text { display: none; }
                    .btn-primary {
                        position: fixed; bottom: 1.5rem; right: 1.5rem; width: 56px; height: 56px;
                        border-radius: 50%; padding: 0; justify-content: center; z-index: 100;
                        box-shadow: 0 10px 25px rgba(15, 23, 42, 0.4);
                    }
                    .crm-card { padding: 1.25rem; }
                }
            `}</style>
        </div>
    );
};

export default CRMList;
