import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    MapPin,
    Camera,
    User,
    Building2,
    ClipboardList,
    CheckCircle,
    AlertCircle,
    Search,
    ChevronDown,
    Upload,
    Info,
    Users
} from 'lucide-react';
import { clienteService, planService } from '../../services/api';

const ClientSearchSelect = ({ clientes, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);

    const selectedClient = clientes.find(c => c.id_cliente === parseInt(value));

    const filtered = clientes.filter(c =>
        c.nombre_cliente.toLowerCase().includes(search.toLowerCase()) ||
        c.ruc_dni?.includes(search)
    ).slice(0, 50);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="client-search-container" ref={dropdownRef}>
            <div className={`client-search-trigger ${!selectedClient ? 'placeholder' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                <Building2 size={16} />
                <span>
                    {selectedClient ? selectedClient.nombre_cliente : 'Seleccionar Cliente...'}
                </span>
                <ChevronDown size={14} className={`arrow ${isOpen ? 'open' : ''}`} />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="client-search-dropdown"
                    >
                        <div className="search-input-wrapper">
                            <Search size={14} />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Buscar cliente..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                        <div className="results-list">
                            {filtered.map(c => (
                                <div
                                    key={c.id_cliente}
                                    className={`result-item ${parseInt(value) === c.id_cliente ? 'selected' : ''}`}
                                    onClick={() => {
                                        onChange(c.id_cliente);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                >
                                    <span className="name">{c.nombre_cliente}</span>
                                    <span className="ruc">RUC: {c.ruc_dni}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .client-search-container { position: relative; width: 100%; }
                .client-search-trigger {
                    display: flex; align-items: center; gap: 10px; background: white;
                    padding: 12px 1rem; border-radius: 14px; border: 1px solid #e2e8f0;
                    cursor: pointer; font-size: 0.95rem; font-weight: 600; color: #1e293b;
                    transition: all 0.2s; min-height: 48px;
                }
                .client-search-trigger:hover { border-color: var(--primary); }
                .client-search-trigger.placeholder { color: #94a3b8; }
                .client-search-trigger .arrow { margin-left: auto; transition: transform 0.2s; color: #94a3b8; }
                .client-search-trigger .arrow.open { transform: rotate(180deg); color: var(--primary); }
                .client-search-dropdown {
                    position: absolute; top: calc(100% + 8px); left: 0; right: 0;
                    background: white; border-radius: 16px; border: 1px solid #e2e8f0;
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); z-index: 1000; padding: 10px;
                }
                .search-input-wrapper { display: flex; align-items: center; gap: 10px; background: #f8fafc; border-radius: 10px; padding: 0 12px; margin-bottom: 10px; border: 1px solid #f1f5f9; }
                .search-input-wrapper input { border: none; background: none; outline: none; padding: 10px 0; width: 100%; font-size: 0.85rem; }
                .results-list { max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
                .result-item { padding: 10px 12px; border-radius: 10px; cursor: pointer; display: flex; flex-direction: column; transition: all 0.2s; }
                .result-item:hover { background: #f1f5f9; }
                .result-item.selected { background: #eff6ff; border-left: 4px solid var(--primary); }
                .result-item .name { font-size: 0.85rem; font-weight: 700; color: #1e293b; }
                .result-item .ruc { font-size: 0.75rem; color: #64748b; }
            `}</style>
        </div>
    );
};

const VisitaModal = ({ isOpen, onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [clientes, setClientes] = useState([]);
    const [planes, setPlanes] = useState([]);
    const [location, setLocation] = useState({ lat: null, lon: null, loading: false });

    const [previews, setPreviews] = useState({ lugar: null, sello: null });
    const [formData, setFormData] = useState({
        id_plan: '',
        id_cliente: '',
        resultado: 'Cliente interesado',
        observaciones: '',
        es_asistida: false,
        acompanante: '',
        foto_lugar: null,
        foto_sello: null
    });

    const resetForm = () => {
        setFormData({
            id_plan: planes.length > 0 ? planes[0].id_plan : '',
            id_cliente: '',
            resultado: 'Cliente interesado',
            observaciones: '',
            es_asistida: false,
            acompanante: '',
            foto_lugar: null,
            foto_sello: null
        });
        setPreviews({ lugar: null, sello: null });
    };

    useEffect(() => {
        if (isOpen) {
            resetForm();
            captureLocation();
            fetchData();
        }
    }, [isOpen]);

    const fetchData = async () => {
        try {
            const [cliData, planData] = await Promise.all([
                clienteService.getAll(0, 500),
                planService.getAll(0, 20) // Obtenemos los planes más recientes
            ]);
            setClientes(cliData);
            setPlanes(planData);

            // Auto-seleccionar el plan más reciente si existe
            if (planData.length > 0) {
                setFormData(prev => ({ ...prev, id_plan: planData[0].id_plan }));
            }
        } catch (error) {
            console.error('Error fetching modal data:', error);
        }
    };

    const captureLocation = () => {
        if (!navigator.geolocation) return;

        setLocation(prev => ({ ...prev, loading: true }));
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude,
                    loading: false
                });
            },
            (err) => {
                console.warn('Geolocation error:', err);
                setLocation(prev => ({ ...prev, loading: false }));
            }
        );
    };

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, [field]: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => ({ ...prev, [field === 'foto_lugar' ? 'lugar' : 'sello']: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.foto_lugar || !formData.foto_sello) {
            alert('Debes adjuntar ambas fotos obligatorias (Lugar y Sello)');
            return;
        }

        // Si es visita asistida, concatenamos la info en observaciones para no tocar el back
        let finalObservations = formData.observaciones;
        if (formData.es_asistida && formData.acompanante) {
            const prefix = `[VISITA ASISTIDA - Acompañante: ${formData.acompanante}]`;
            finalObservations = finalObservations ? `${prefix} ${finalObservations}` : prefix;
        }

        const data = new FormData();
        data.append('id_plan', formData.id_plan);
        data.append('id_cliente', formData.id_cliente);
        data.append('resultado', formData.resultado);
        data.append('observaciones', finalObservations);
        if (location.lat) {
            data.append('lat', location.lat.toString());
            data.append('lon', location.lon.toString());
        }
        data.append('foto_lugar', formData.foto_lugar);
        data.append('foto_sello', formData.foto_sello);

        setLoading(true);
        await onSave(data);
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="modal-card glass-morphism"
            >
                <div className="modal-header">
                    <div className="title-wrap">
                        <div className="icon-box"><Camera size={20} /></div>
                        <div>
                            <h3>Registrar Visita</h3>
                            <p>Completa el reporte de actividad en campo.</p>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-grid">
                        <div className="form-group full">
                            <label>Seleccionar Cliente</label>
                            <ClientSearchSelect
                                clientes={clientes}
                                value={formData.id_cliente}
                                onChange={(val) => setFormData({ ...formData, id_cliente: val })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Plan de Trabajo Vinculado</label>
                            <div className="input-with-icon">
                                <ClipboardList size={18} />
                                <select
                                    value={formData.id_plan}
                                    onChange={(e) => setFormData({ ...formData, id_plan: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccione Plan...</option>
                                    {planes.map(p => (
                                        <option key={p.id_plan} value={p.id_plan}>
                                            Semana {p.fecha_inicio_semana} (#ID: {p.id_plan})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Estado del Resultado</label>
                            <div className="input-with-icon">
                                <CheckCircle size={18} />
                                <select
                                    value={formData.resultado}
                                    onChange={(e) => setFormData({ ...formData, resultado: e.target.value })}
                                    required
                                >
                                    <option value="Cliente interesado">Cliente interesado</option>
                                    <option value="En evaluación">En evaluación</option>
                                    <option value="Venta cerrada">Venta cerrada</option>
                                    <option value="No interesado">No interesado</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group full">
                            <label>Geo-Localización Automática</label>
                            <div className={`geo-box ${location.lat ? 'active' : ''}`}>
                                <MapPin size={18} />
                                {location.loading ? (
                                    <span>Capturando coordenadas GPS...</span>
                                ) : location.lat ? (
                                    <span>Coordenadas capturadas: {location.lat.toFixed(6)}, {location.lon.toFixed(6)}</span>
                                ) : (
                                    <span className="error">GPS no disponible. Asegúrate de dar permisos.</span>
                                )}
                                {location.lat && <div className="dot"></div>}
                            </div>
                        </div>

                        <div className="form-group full assisted-visit-section">
                            <div className="switch-group">
                                <label className="switch-label">
                                    <Users size={18} />
                                    <span>¿Es una visita asistida?</span>
                                </label>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={formData.es_asistida}
                                        onChange={(e) => setFormData({ ...formData, es_asistida: e.target.checked })}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>

                            <AnimatePresence>
                                {formData.es_asistida && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="acompanante-input-wrapper"
                                    >
                                        <div className="input-with-icon">
                                            <User size={18} />
                                            <input
                                                type="text"
                                                placeholder="Nombre de la persona que acompaña..."
                                                value={formData.acompanante}
                                                onChange={(e) => setFormData({ ...formData, acompanante: e.target.value })}
                                                required={formData.es_asistida}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="form-group full">
                            <label>Evidencia Fotográfica (Obligatorio)</label>
                            <div className="photo-upload-grid">
                                <div className="photo-input-card">
                                    <input
                                        type="file"
                                        id="foto_lugar"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={(e) => handleFileChange(e, 'foto_lugar')}
                                    />
                                    <label htmlFor="foto_lugar" className={previews.lugar ? 'has-preview' : ''}>
                                        {previews.lugar ? (
                                            <img src={previews.lugar} className="preview-img" />
                                        ) : (
                                            <div className="upload-placeholder">
                                                <Upload size={24} />
                                                <span>Foto del Lugar (Fachada)</span>
                                            </div>
                                        )}
                                    </label>
                                </div>

                                <div className="photo-input-card">
                                    <input
                                        type="file"
                                        id="foto_sello"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={(e) => handleFileChange(e, 'foto_sello')}
                                    />
                                    <label htmlFor="foto_sello" className={previews.sello ? 'has-preview' : ''}>
                                        {previews.sello ? (
                                            <img src={previews.sello} className="preview-img" />
                                        ) : (
                                            <div className="upload-placeholder">
                                                <Upload size={24} />
                                                <span>Foto Sello / Constancia</span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="form-group full">
                            <label>Observaciones de la Visita</label>
                            <textarea
                                placeholder="Escribe detalles relevantes encontrados en la visita..."
                                value={formData.observaciones}
                                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <div className="info-msg">
                            <Info size={14} />
                            <span>Esta acción suma puntos a tus KPIs semanales.</span>
                        </div>
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? 'Subiendo Reporte...' : 'Guardar y Finalizar'}
                        </button>
                    </div>
                </form>
            </motion.div>

            <style jsx>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(8px); display: flex; align-items: center;
          justify-content: center; z-index: 2000; padding: 1.5rem;
        }
        .modal-card {
          width: 100%; max-width: 650px; background: white; border-radius: 24px;
          display: flex; flex-direction: column; overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2);
        }
        .modal-header {
          padding: 1.5rem 2rem; border-bottom: 1px solid #f1f5f9;
          display: flex; justify-content: space-between; align-items: center; background: #fafafa;
        }
        .title-wrap { display: flex; align-items: center; gap: 15px; }
        .icon-box {
          width: 44px; height: 44px; background: #e0f2fe; color: #0ea5e9;
          border-radius: 12px; display: flex; align-items: center; justify-content: center;
        }
        .title-wrap h3 { font-size: 1.25rem; font-weight: 800; color: #1e293b; line-height: 1; margin-bottom: 4px; }
        .title-wrap p { font-size: 0.85rem; color: #64748b; font-weight: 500; }
        .close-btn { background: none; border: none; color: #94a3b8; cursor: pointer; transition: color 0.2s; }
        .close-btn:hover { color: #ef4444; }

        .modal-body { padding: 2rem; overflow-y: auto; max-height: calc(100vh - 200px); }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .form-group.full { grid-column: span 2; }
        .form-group label { display: block; font-size: 0.8rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; padding-left: 4px; }
        
        .input-with-icon {
          position: relative; display: flex; align-items: center;
          background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px;
          height: 48px; transition: all 0.2s;
        }
        .input-with-icon:focus-within { border-color: #0ea5e9; background: white; box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1); }
        .input-with-icon svg { position: absolute; left: 14px; color: #94a3b8; pointer-events: none; }
        .input-with-icon select {
          width: 100%; height: 100%; background: none; border: none; padding: 0 1rem 0 44px;
          font-size: 0.95rem; font-weight: 600; color: #1e293b; cursor: pointer; outline: none; -webkit-appearance: none;
        }

        .geo-box {
          display: flex; align-items: center; gap: 10px; background: #f1f5f9;
          padding: 12px 1rem; border-radius: 12px; border: 1px solid #e2e8f0;
          font-size: 0.85rem; font-weight: 700; color: #64748b; position: relative;
        }
        .geo-box.active { background: #f0fdf4; color: #10b981; border-color: #bbf7d0; }
        .geo-box .error { color: #ef4444; }
        .geo-box .dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 10px #22c55e; animation: pulse 2s infinite; }

        .photo-upload-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .photo-input-card { position: relative; }
        .photo-input-card input { display: none; }
        .photo-input-card label {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          height: 140px; border: 2px dashed #cbd5e1; border-radius: 16px; background: #f8fafc;
          cursor: pointer; transition: all 0.2s; margin-bottom: 0; padding: 0; overflow: hidden;
        }
        .photo-input-card label:hover { border-color: #0ea5e9; background: #eff6ff; }
        .photo-input-card label.has-preview { border-style: solid; border-color: #0ea5e9; }
        .upload-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; color: #64748b; }
        .preview-img { width: 100%; height: 100%; object-fit: cover; }

        textarea {
          width: 100%; height: 100px; background: #f8fafc; border: 1.5px solid #e2e8f0;
          border-radius: 12px; padding: 12px 1rem; font-family: inherit; font-size: 0.95rem;
          color: #1e293b; outline: none; transition: all 0.2s; resize: none;
        }
        textarea:focus { border-color: #0ea5e9; background: white; box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1); }

        .modal-footer {
          padding: 1.5rem 2rem; border-top: 1px solid #f1f5f9;
          display: flex; align-items: center; gap: 15px; background: #fafafa;
        }
        .info-msg { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; font-weight: 700; color: #8b5cf1; margin-right: auto; }
        .btn-cancel {
          padding: 0.8rem 1.5rem; border-radius: 12px; border: 1px solid #e2e8f0;
          background: white; color: #64748b; font-weight: 700; cursor: pointer; transition: all 0.2s;
        }
        .btn-cancel:hover { background: #f1f5f9; color: #1e293b; }
        .btn-save {
          padding: 0.8rem 1.8rem; border-radius: 12px; border: none;
          background: #1e293b; color: white; font-weight: 700; cursor: pointer;
          transition: all 0.3s; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        }
        .btn-save:hover:not(:disabled) { transform: translateY(-2px); background: #0b1120; box-shadow: 0 15px 25px -5px rgba(0,0,0,0.2); }
        .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Switch Styles */
        .assisted-visit-section { background: #f8fafc; padding: 1rem; border-radius: 16px; border: 1px solid #e2e8f0; }
        .switch-group { display: flex; justify-content: space-between; align-items: center; }
        .switch-label { display: flex; align-items: center; gap: 8px; font-weight: 700; color: #475569; font-size: 0.9rem; margin-bottom: 0 !important; cursor: pointer; }
        .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; inset: 0; background-color: #cbd5e1; transition: .4s; border-radius: 34px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: #0ea5e9; }
        input:checked + .slider:before { transform: translateX(20px); }
        .acompanante-input-wrapper { overflow: hidden; margin-top: 12px; }
        .acompanante-input-wrapper .input-with-icon input {
            width: 100%; height: 100%; background: none; border: none; padding: 0 1rem 0 44px;
            font-size: 0.95rem; font-weight: 600; color: #1e293b; outline: none;
        }

        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
        </div>
    );
};

export default VisitaModal;
