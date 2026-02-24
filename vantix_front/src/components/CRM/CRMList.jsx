import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PhoneCall,
    Mail,
    Search,
    Plus,
    Calendar,
    Clock,
    User,
    ChevronRight,
    Filter,
    MessageSquare,
    Send,
    CheckCircle2,
    X
} from 'lucide-react';
import { crmService } from '../../services/api';
import LlamadaModal from './LlamadaModal';
import EmailModal from './EmailModal';

const CRMList = () => {
    const [activeTab, setActiveTab] = useState('llamadas'); // 'llamadas' o 'emails'
    const [llamadas, setLlamadas] = useState([]);
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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
                    <button
                        className={activeTab === 'llamadas' ? 'active' : ''}
                        onClick={() => setActiveTab('llamadas')}
                    >
                        <PhoneCall size={16} />
                        Llamadas
                    </button>
                    <button
                        className={activeTab === 'emails' ? 'active' : ''}
                        onClick={() => setActiveTab('emails')}
                    >
                        <Mail size={16} />
                        Emails
                    </button>
                </div>
            </div>

            <div className="control-bar card-premium">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder={activeTab === 'llamadas' ? "Buscar por número o nombre..." : "Buscar por email o asunto..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    className="btn-primary"
                    onClick={() => activeTab === 'llamadas' ? setIsLlamadaModalOpen(true) : setIsEmailModalOpen(true)}
                >
                    <Plus size={18} />
                    <span>{activeTab === 'llamadas' ? 'Registrar Llamada' : 'Registrar Email'}</span>
                </button>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="crm-content"
                >
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Sincronizando registros...</p>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="empty-state card-premium">
                            {activeTab === 'llamadas' ? <PhoneCall size={48} /> : <Mail size={48} />}
                            <p>No hay {activeTab} registradas recientemente.</p>
                        </div>
                    ) : (
                        <div className="crm-grid">
                            {filteredData.map((item) => (
                                <motion.div
                                    layout
                                    key={activeTab === 'llamadas' ? item.id_llamada : item.id_email}
                                    className="crm-card card-premium"
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
                                        {activeTab === 'llamadas' ? (
                                            <>
                                                <div className="meta-row">
                                                    <div className="meta-item">
                                                        <Clock size={14} />
                                                        <span>{item.duracion_segundos} seg.</span>
                                                    </div>
                                                    <div className="meta-item">
                                                        <CheckCircle2 size={14} />
                                                        <span>{item.resultado}</span>
                                                    </div>
                                                </div>
                                                <p className="item-notes">{item.notas_llamada || 'Sin notas adicionales.'}</p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="meta-row">
                                                    <div className="meta-item">
                                                        <Send size={14} />
                                                        <span>{item.estado_envio}</span>
                                                    </div>
                                                </div>
                                                <p className="item-notes"><strong>Asunto:</strong> {item.asunto || '(Sin asunto)'}</p>
                                            </>
                                        )}
                                    </div>
                                    <div className="card-footer">
                                        <div className="plan-badge">
                                            <Calendar size={12} />
                                            <span>Semana {item.id_plan}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Modales */}
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

            <style jsx>{`
                .crm-container { display: flex; flex-direction: column; gap: 1.5rem; animation: fadeIn 0.5s ease-out; }
                .section-header { display: flex; justify-content: space-between; align-items: center; }
                .title-group h2 { font-size: 1.8rem; font-weight: 800; color: #1e293b; letter-spacing: -0.02em; }
                .title-group p { color: #64748b; font-size: 0.95rem; }
                
                .tab-switcher { display: flex; padding: 4px; border-radius: 12px; gap: 4px; background: white; }
                .tab-switcher button {
                    padding: 8px 16px; border-radius: 8px; border: none; background: transparent;
                    display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 700;
                    color: #64748b; cursor: pointer; transition: all 0.2s;
                }
                .tab-switcher button.active { background: #0f172a; color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

                .control-bar { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; }
                .search-box { display: flex; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0 1rem; width: 400px; height: 44px; }
                .search-icon { color: #94a3b8; margin-right: 10px; }
                .search-box input { border: none; background: transparent; outline: none; width: 100%; font-size: 0.9rem; }
                
                .btn-primary { 
                    background: #1e293b; color: white; border: none; padding: 0.75rem 1.25rem; border-radius: 12px;
                    display: flex; align-items: center; gap: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s;
                }
                .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }

                .crm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
                .crm-card { display: flex; flex-direction: column; padding: 1.5rem; gap: 1rem; transition: all 0.3s; }
                .crm-card:hover { transform: translateY(-5px); border-color: #0ea5e9; }
                
                .card-header { display: flex; gap: 12px; align-items: flex-start; }
                .icon-indicator { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
                .icon-indicator.llamadas { background: #f0f9ff; color: #0ea5e9; }
                .icon-indicator.emails { background: #fdf2f8; color: #db2777; }
                
                .item-info { display: flex; flex-direction: column; gap: 2px; }
                .item-info h4 { font-size: 0.95rem; font-weight: 800; color: #1e293b; }
                .item-info span { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }
                
                .meta-row { display: flex; gap: 1rem; margin-top: 0.5rem; }
                .meta-item { display: flex; align-items: center; gap: 5px; font-size: 0.75rem; font-weight: 700; color: #64748b; }
                
                .item-notes { font-size: 0.85rem; color: #475569; line-height: 1.5; margin-top: 0.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                
                .card-footer { margin-top: auto; padding-top: 1rem; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
                .plan-badge { display: flex; align-items: center; gap: 4px; font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; }

                .loading-state, .empty-state { display: flex; flex-direction: column; align-items: center; padding: 5rem; gap: 1rem; color: #94a3b8; text-align: center; }
                .spinner { width: 30px; height: 30px; border: 3px solid #f1f5f9; border-top-color: #0ea5e9; border-radius: 50%; animation: spin 1s linear infinite; }
                
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default CRMList;
