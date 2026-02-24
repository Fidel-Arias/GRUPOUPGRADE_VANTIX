import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { visitaService, clienteService, planService } from '../../services/api';
import VisitaModal from './VisitaModal';
import {
    MapPin,
    Search,
    Plus,
    Calendar,
    Camera,
    CheckCircle,
    Clock,
    Trash2,
    Filter,
    Users,
    Eye,
    ExternalLink,
    ChevronRight,
    X,
    AlertCircle
} from 'lucide-react';

const VisitaList = () => {
    const [visitas, setVisitas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' o 'table'
    const [previewPhoto, setPreviewPhoto] = useState(null); // URL de la foto a previsualizar
    const [deleteConfirm, setDeleteConfirm] = useState(null); // ID de la visita a eliminar

    const BACKEND_URL = 'http://127.0.0.1:8000';

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

    const getStatusColor = (status) => {
        switch (status) {
            case 'Venta cerrada': return 'status-success';
            case 'Cliente interesado': return 'status-info';
            case 'En evaluación': return 'status-warning';
            case 'No interesado': return 'status-danger';
            default: return '';
        }
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

    return (
        <div className="visitas-container">
            <div className="section-header">
                <div className="title-group">
                    <h2>Registro de Visitas</h2>
                    <p>Historial y seguimiento de actividad en campo.</p>
                </div>
                <div className="action-group">
                    <div className="view-toggle card-premium">
                        <button
                            className={viewMode === 'grid' ? 'active' : ''}
                            onClick={() => setViewMode('grid')}
                        >
                            Grid
                        </button>
                        <button
                            className={viewMode === 'table' ? 'active' : ''}
                            onClick={() => setViewMode('table')}
                        >
                            Tabla
                        </button>
                    </div>
                    <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} />
                        <span>Registrar Visita</span>
                    </button>
                </div>
            </div>

            <div className="filters-bar card-premium">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente u observaciones..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="quick-stats">
                    <div className="stat-item">
                        <span className="stat-value">{visitas.length}</span>
                        <span className="stat-label">Total Visitas</span>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Cargando registros...</p>
                </div>
            ) : filteredVisitas.length === 0 ? (
                <div className="empty-state card-premium">
                    <MapPin size={48} />
                    <p>No se encontraron visitas registradas.</p>
                    <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                        Registrar Primera Visita
                    </button>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="visitas-grid">
                    {filteredVisitas.map((visita) => (
                        <div key={visita.id_visita} className="visita-card card-premium">
                            <div className="visita-image-header">
                                <img
                                    src={`${BACKEND_URL}${visita.url_foto_lugar}`}
                                    alt="Lugar"
                                    className="main-img"
                                    onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=500&auto=format&fit=crop'}
                                />
                                <div className="visita-badge">
                                    <span className={`status-tag ${getStatusColor(visita.resultado)}`}>
                                        {visita.resultado}
                                    </span>
                                </div>
                                <div className="visita-sello">
                                    <img src={`${BACKEND_URL}${visita.url_foto_sello}`} alt="Sello" />
                                </div>
                            </div>

                            <div className="visita-content">
                                <div className="visita-header">
                                    <h3>{visita.cliente?.nombre_cliente || 'Cliente no especificado'}</h3>
                                    <span className="visita-date">
                                        <Clock size={12} />
                                        {formatDate(visita.fecha_hora_checkin)}
                                    </span>
                                </div>

                                <p className="visita-obs">{visita.observaciones || 'Sin observaciones adicionales.'}</p>

                                <div className="visita-meta">
                                    <div className="meta-item">
                                        <MapPin size={14} />
                                        <span>{visita.cliente?.id_distrito || 'Ubicación'}</span>
                                    </div>
                                    {visita.geolocalizacion_lat && (
                                        <div className="meta-item location">
                                            <CheckCircle size={14} />
                                            <span>Geo-referenciado</span>
                                        </div>
                                    )}
                                </div>

                                <div className="visita-footer">
                                    <button className="btn-view" onClick={() => setPreviewPhoto(`${BACKEND_URL}${visita.url_foto_lugar}`)}>
                                        <Eye size={16} />
                                    </button>
                                    <button className="btn-delete" onClick={() => setDeleteConfirm(visita.id_visita)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="table-wrapper card-premium">
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Resultado</th>
                                <th>Fecha / Hora</th>
                                <th>Ubicación</th>
                                <th>Evidencia</th>
                                <th className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVisitas.map((visita) => (
                                <tr key={visita.id_visita}>
                                    <td>
                                        <div className="client-cell">
                                            <span className="client-name">{visita.cliente?.nombre_cliente}</span>
                                            <span className="client-sub">RUC: {visita.cliente?.ruc_dni}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-tag ${getStatusColor(visita.resultado)}`}>
                                            {visita.resultado}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="date-cell">
                                            <span>{new Date(visita.fecha_hora_checkin).toLocaleDateString()}</span>
                                            <span className="time">{new Date(visita.fecha_hora_checkin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </td>
                                    <td>
                                        {visita.geolocalizacion_lat ? (
                                            <a
                                                href={`https://www.google.com/maps?q=${visita.geolocalizacion_lat},${visita.geolocalizacion_lon}`}
                                                target="_blank"
                                                className="location-link"
                                            >
                                                Ver Mapa <ExternalLink size={12} />
                                            </a>
                                        ) : 'N/A'}
                                    </td>
                                    <td>
                                        <div className="evidencia-thumbnails">
                                            <img src={`${BACKEND_URL}${visita.url_foto_lugar}`} className="thumb" onClick={() => setPreviewPhoto(`${BACKEND_URL}${visita.url_foto_lugar}`)} />
                                            <img src={`${BACKEND_URL}${visita.url_foto_sello}`} className="thumb" onClick={() => setPreviewPhoto(`${BACKEND_URL}${visita.url_foto_sello}`)} />
                                        </div>
                                    </td>
                                    <td className="text-right">
                                        <button className="action-icon-btn danger" onClick={() => setDeleteConfirm(visita.id_visita)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <VisitaModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveVisita}
            />

            {/* Modal de Previsualización de Foto */}
            <AnimatePresence>
                {previewPhoto && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="photo-preview-overlay"
                        onClick={() => setPreviewPhoto(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="preview-content"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button className="close-preview" onClick={() => setPreviewPhoto(null)}>
                                <X size={24} />
                            </button>
                            <img src={previewPhoto} alt="Vista previa" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal de Confirmación de Eliminación */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                        onClick={() => setDeleteConfirm(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="delete-modal-card glass-morphism"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="delete-icon-box">
                                <AlertCircle size={32} />
                            </div>
                            <h3>¿Eliminar Registro?</h3>
                            <p>Esta acción es irreversible y eliminará las fotos y datos del servidor. Se recalcularán los KPIs del empleado.</p>

                            <div className="delete-actions">
                                <button className="btn-cancel-alt" onClick={() => setDeleteConfirm(null)}>No, cancelar</button>
                                <button className="btn-confirm-delete" onClick={handleDelete}>Sí, eliminar ahora</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
        .visitas-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          animation: fadeIn 0.5s ease-out;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 0.5rem;
        }

        .title-group h2 {
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--text-heading);
          letter-spacing: -0.02em;
        }

        .title-group p {
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        .action-group {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .view-toggle {
          display: flex;
          padding: 4px;
          border-radius: 12px;
          gap: 4px;
        }

        .view-toggle button {
          padding: 6px 16px;
          border-radius: 8px;
          border: none;
          background: transparent;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-toggle button.active {
          background: var(--bg-app);
          color: var(--primary);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
        }

        .btn-primary {
          background: var(--bg-sidebar);
          color: white;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 10px 20px -5px rgba(15, 23, 42, 0.2);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px -10px rgba(15, 23, 42, 0.3);
        }

        .filters-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
        }

        .search-box {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 0 1.25rem;
          width: 400px;
          height: 46px;
          transition: all 0.3s;
        }

        .search-box:focus-within {
          border-color: var(--primary);
          background: white;
          box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1);
        }

        .search-icon {
          color: #94a3b8;
          margin-right: 12px;
        }

        .search-box input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 0.95rem;
          color: var(--text-heading);
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .stat-value {
          font-size: 1.2rem;
          font-weight: 800;
          color: var(--primary);
        }

        .stat-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* GRID STYLES */
        .visitas-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .visita-card {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding: 0;
          transition: all 0.3s;
        }

        .visita-card:hover {
          transform: translateY(-8px);
          border-color: var(--primary);
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);
        }

        .visita-image-header {
          height: 200px;
          position: relative;
          background: #f1f5f9;
        }

        .main-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .visita-badge {
          position: absolute;
          top: 12px;
          left: 12px;
        }

        .status-tag {
          padding: 4px 12px;
          border-radius: 30px;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-success { background: #dcfce7; color: #166534; }
        .status-info { background: #e0f2fe; color: #0369a1; }
        .status-warning { background: #fef9c3; color: #854d0e; }
        .status-danger { background: #fee2e2; color: #991b1b; }

        .visita-sello {
          position: absolute;
          bottom: -20px;
          right: 20px;
          width: 70px;
          height: 70px;
          border-radius: 12px;
          background: white;
          padding: 4px;
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
          border: 1px solid #e2e8f0;
          z-index: 2;
        }

        .visita-sello img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 8px;
        }

        .visita-content {
          padding: 2rem 1.5rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .visita-header h3 {
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--text-heading);
          margin-bottom: 4px;
        }

        .visita-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .visita-obs {
          font-size: 0.9rem;
          color: var(--text-body);
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .visita-meta {
          display: flex;
          gap: 1rem;
          margin-top: auto;
          padding-top: 0.5rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
        }

        .meta-item.location {
          color: #10b981;
        }

        .visita-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 1rem;
          border-top: 1px solid #f1f5f9;
          padding-top: 1rem;
        }

        .btn-view, .btn-delete {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-view { background: #f1f5f9; color: #475569; }
        .btn-view:hover { background: #e2e8f0; color: var(--primary); }
        .btn-delete { background: #fff1f2; color: #e11d48; }
        .btn-delete:hover { background: #ffe4e6; transform: scale(1.1); }

        /* TABLE STYLES */
        .table-wrapper { padding: 0; overflow: hidden; }
        .custom-table { width: 100%; border-collapse: collapse; text-align: left; }
        .custom-table th { background: #f8fafc; padding: 1.25rem 1.5rem; font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; }
        .custom-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f8fafc; vertical-align: middle; }
        
        .client-cell { display: flex; flex-direction: column; }
        .client-name { font-weight: 700; color: var(--text-heading); }
        .client-sub { font-size: 0.75rem; color: #94a3b8; }
        
        .date-cell { display: flex; flex-direction: column; gap: 2px; font-size: 0.85rem; }
        .date-cell .time { font-weight: 700; color: var(--primary); }
        
        .location-link { display: inline-flex; align-items: center; gap: 6px; color: var(--primary); font-weight: 700; font-size: 0.85rem; text-decoration: none; }
        
        .evidencia-thumbnails { display: flex; gap: 8px; }
        .thumb { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; border: 1px solid #e2e8f0; }

        .action-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid #f1f5f9;
          background: white;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-icon-btn.danger:hover { background: #fee2e2; color: #ef4444; border-color: #fecaca; }

        .loading-state, .empty-state {
          display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6rem 2rem; gap: 1.5rem; color: #94a3b8; text-align: center;
        }

        .spinner { width: 40px; height: 40px; border: 4px solid #f1f5f9; border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 1024px) {
          .filters-bar { flex-direction: column; gap: 1rem; }
          .search-box { width: 100%; }
        }

        /* Photo Preview Styles */
        .photo-preview-overlay {
            position: fixed; inset: 0; background: rgba(15, 23, 42, 0.9);
            backdrop-filter: blur(8px); display: flex; align-items: center;
            justify-content: center; z-index: 3000; padding: 2rem;
        }
        .preview-content {
            position: relative; max-width: 90vw; max-height: 90vh;
            background: white; border-radius: 20px; overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }
        .preview-content img { width: 100%; height: auto; display: block; max-height: 90vh; object-fit: contain; }
        .close-preview {
            position: absolute; top: 1rem; right: 1rem;
            width: 44px; height: 44px; border-radius: 50%;
            background: white; border: none; color: #1e293b;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10;
        }
        .close-preview:hover { transform: scale(1.1); background: #f1f5f9; }
        .evidencia-thumbnails .thumb { cursor: pointer; transition: transform 0.2s; }
        .evidencia-thumbnails .thumb:hover { transform: scale(1.1); border-color: var(--primary); }

        /* Modal Overlay for Delete and other overlays */
        .modal-overlay {
            position: fixed; inset: 0; background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(8px); display: flex; align-items: center;
            justify-content: center; z-index: 4000; padding: 2rem;
        }

        /* Delete Modal Styles */
        .delete-modal-card {
            background: white; border-radius: 24px; padding: 2.5rem;
            max-width: 400px; width: 90%; text-align: center;
            display: flex; flex-direction: column; align-items: center; gap: 1rem;
        }
        .delete-icon-box {
            width: 80px; height: 80px; background: #fff1f2; color: #e11d48;
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            margin-bottom: 0.5rem;
        }
        .delete-modal-card h3 { font-size: 1.5rem; font-weight: 800; color: #1e293b; }
        .delete-modal-card p { font-size: 0.95rem; color: #64748b; line-height: 1.5; margin-bottom: 1rem; }
        .delete-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; width: 100%; }
        .btn-cancel-alt {
            padding: 0.8rem; border-radius: 12px; border: 1.5px solid #e2e8f0;
            background: white; color: #64748b; font-weight: 700; cursor: pointer; transition: all 0.2s;
        }
        .btn-cancel-alt:hover { background: #f8fafc; color: #1e293b; }
        .btn-confirm-delete {
            padding: 0.8rem; border-radius: 12px; border: none;
            background: #e11d48; color: white; font-weight: 700; cursor: pointer; transition: all 0.2s;
        }
        .btn-confirm-delete:hover { background: #be123c; transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(225, 29, 72, 0.4); }
      `}</style>
        </div>
    );
};

export default VisitaList;
