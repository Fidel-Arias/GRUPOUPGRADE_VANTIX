import React, { useState, useEffect } from 'react';
import { visitaService, BASE_URL } from '../../services/api';
import VisitaModal from './VisitaModal';
import PageHeader from '../Common/PageHeader';
import PremiumCard from '../Common/PremiumCard';
import Badge from '../Common/Badge';
import SearchInput from '../Common/SearchInput';
import LoadingSpinner from '../Common/LoadingSpinner';
import EmptyState from '../Common/EmptyState';
import ConfirmModal from '../Common/ConfirmModal';
import PhotoPreview from '../Common/PhotoPreview';
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
    List
} from 'lucide-react';

const VisitaList = () => {
    const [visitas, setVisitas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [previewPhoto, setPreviewPhoto] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        fetchVisitas();
    }, []);

    const fetchVisitas = async () => {
        try {
            setLoading(true);
            const data = await visitaService.getAll();
            setVisitas(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveVisita = async (formData) => {
        try {
            await visitaService.create(formData);
            fetchVisitas();
            setIsModalOpen(false);
        } catch (error) {
            alert('Error al registrar visita: ' + error.message);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await visitaService.delete(deleteConfirm);
            fetchVisitas();
            setDeleteConfirm(null);
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const filteredVisitas = visitas.filter(v =>
        v.cliente?.nombre_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.observaciones?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
        <div className="visitas-container">
            <PageHeader
                title="Registro de Visitas"
                description="Historial y seguimiento de actividad en campo."
                icon={Navigation}
                breadcrumb={['Apps', 'Visitas']}
                actions={
                    <div className="action-group">
                        <div className="view-toggle">
                            <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}>
                                <LayoutGrid size={16} />
                                <span>Grid</span>
                            </button>
                            <button className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')}>
                                <List size={16} />
                                <span>Tabla</span>
                            </button>
                        </div>
                        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                            <Plus size={20} />
                            <span className="btn-text">Nueva Visita</span>
                        </button>
                    </div>
                }
            />

            <PremiumCard className="control-bar" hover={false}>
                <SearchInput
                    placeholder="Buscar por cliente u observaciones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </PremiumCard>

            {loading ? (
                <div className="loading-wrapper">
                    <LoadingSpinner message="Consultando reportes de visita..." />
                </div>
            ) : filteredVisitas.length === 0 ? (
                <EmptyState
                    icon={MapPin}
                    title="Sin visitas registradas"
                    message="No hay registros para los filtros seleccionados."
                />
            ) : viewMode === 'grid' ? (
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
                                <button className="delete-btn" onClick={() => setDeleteConfirm(v.id_visita)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </PremiumCard>
                    ))}
                </div>
            ) : (
                <PremiumCard className="table-card">
                    <table className="elite-table">
                        <thead>
                            <tr>
                                <th>CLIENTE</th>
                                <th>UBICACIÓN</th>
                                <th>RESULTADO</th>
                                <th>FECHA</th>
                                <th className="text-right">ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVisitas.map((v) => (
                                <tr key={v.id_visita}>
                                    <td>
                                        <div className="table-client-cell">
                                            <span className="name">{v.cliente?.nombre_cliente}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="table-geo">
                                            <MapPin size={14} />
                                            <span>{v.distrito}</span>
                                        </div>
                                    </td>
                                    <td><Badge variant={getStatusVariant(v.resultado)}>{v.resultado}</Badge></td>
                                    <td>
                                        <div className="table-time">
                                            <Clock size={14} />
                                            <span>{formatDate(v.fecha_registro)}</span>
                                        </div>
                                    </td>
                                    <td className="text-right">
                                        <div className="table-actions">
                                            {v.foto_url && (
                                                <button className="action-icon-btn" onClick={() => setPreviewPhoto(`${BASE_URL}${v.foto_url}`)}>
                                                    <Eye size={16} />
                                                </button>
                                            )}
                                            <button className="action-icon-btn danger" onClick={() => setDeleteConfirm(v.id_visita)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </PremiumCard>
            )}

            <VisitaModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveVisita}
            />

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
                .visitas-container { display: flex; flex-direction: column; gap: 1.5rem; }

                .action-group { display: flex; align-items: center; gap: 12px; }

                .view-toggle {
                    display: flex; gap: 4px; padding: 4px; background: white;
                    border: 1px solid var(--border-subtle); border-radius: 12px;
                }
                :global(.dark) .view-toggle { background: var(--bg-panel); border-color: var(--border-light); }

                .view-toggle button {
                    display: flex; align-items: center; gap: 8px; padding: 8px 16px;
                    border: none; background: transparent; color: var(--text-muted);
                    font-weight: 800; font-size: 0.8rem; cursor: pointer; transition: all 0.2s;
                    border-radius: 8px;
                }
                .view-toggle button.active { background: var(--bg-sidebar); color: white; }

                .btn-primary {
                    background: var(--bg-sidebar); color: white; padding: 0.8rem 1.5rem; border-radius: 12px;
                    border: none; display: flex; align-items: center; gap: 10px; font-weight: 700; cursor: pointer;
                    transition: all 0.2s; box-shadow: var(--shadow-md);
                }
                .btn-primary:hover { transform: translateY(-2px); opacity: 0.9; }

                .control-bar { padding: 1rem 1.5rem; }

                .visitas-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; }

                :global(.visita-card) { padding: 1.5rem !important; display: flex; flex-direction: column; gap: 1.25rem; }
                
                .visit-header { display: flex; justify-content: space-between; align-items: flex-start; }
                .client-info { display: flex; align-items: center; gap: 12px; }
                .avatar {
                    width: 44px; height: 44px; border-radius: 12px; background: var(--bg-app);
                    color: var(--primary); display: flex; align-items: center; justify-content: center;
                    font-weight: 800; border: 1px solid var(--border-subtle);
                }
                .text { display: flex; flex-direction: column; }
                .client-name { font-weight: 800; color: var(--text-heading); font-size: 1rem; }
                .location { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }

                .notes { font-size: 0.9rem; color: var(--text-body); line-height: 1.6; margin: 0; }

                .visit-photo {
                    position: relative; height: 180px; border-radius: 14px; overflow: hidden;
                    border: 1px solid var(--border-subtle); cursor: pointer;
                }
                .visit-photo img { width: 100%; height: 100%; object-fit: cover; }
                .visit-photo .overlay {
                    position: absolute; inset: 0; background: rgba(0,0,0,0.4);
                    display: flex; align-items: center; justify-content: center;
                    color: white; opacity: 0; transition: 0.2s;
                }
                .visit-photo:hover .overlay { opacity: 1; }

                .visit-footer {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-top: auto; padding-top: 1.25rem; border-top: 1px solid var(--border-light);
                }
                .time { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }
                
                .delete-btn {
                    width: 32px; height: 32px; border-radius: 8px; border: none;
                    background: #fff1f2; color: #ef4444; display: flex; align-items: center;
                    justify-content: center; cursor: pointer; transition: 0.2s;
                }
                .delete-btn:hover { background: #fee2e2; transform: scale(1.1); }

                .table-card { padding: 0 !important; overflow: hidden; }
                .elite-table { width: 100%; border-collapse: collapse; text-align: left; }
                .elite-table th {
                    padding: 1.25rem 1.5rem; background: #fafbfc; font-size: 0.75rem; 
                    font-weight: 800; color: var(--text-muted); text-transform: uppercase;
                    letter-spacing: 0.05em; border-bottom: 1px solid var(--border-subtle);
                }
                :global(.dark) .elite-table th { background: rgba(255,255,255,0.02); }
                .elite-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-light); vertical-align: middle; }

                .table-client-cell .name { font-weight: 700; color: var(--text-heading); }
                .table-geo, .table-time { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-body); }
                
                .table-actions { display: flex; gap: 8px; justify-content: flex-end; }
                .action-icon-btn {
                    width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--border-subtle);
                    display: flex; align-items: center; justify-content: center; background: white;
                    color: var(--text-muted); cursor: pointer; transition: 0.2s;
                }
                .action-icon-btn:hover { border-color: var(--primary); color: var(--primary); }
                .action-icon-btn.danger:hover { background: #fff1f2; color: #ef4444; border-color: #ef4444; }

                .loading-wrapper { padding: 5rem; display: flex; justify-content: center; width: 100%; }

                @media (max-width: 1024px) {
                    .visitas-grid { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
                }

                @media (max-width: 640px) {
                    .action-group { flex-direction: column; align-items: stretch; }
                    .visitas-grid { grid-template-columns: 1fr; }
                    .btn-text { display: none; }
                }
            `}</style>
        </div>
    );
};

export default VisitaList;
