import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Building2,
    FileText,
    MapPin,
    Search,
    CheckCircle,
    AlertCircle,
    Building,
    Map,
    Plus
} from 'lucide-react';
import { maestroService, geoService } from '../../services/api';

const NuevoClienteModal = ({ isOpen, onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [geoLoading, setGeoLoading] = useState({ dpto: false, prov: false, dist: false });
    const [departamentos, setDepartamentos] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [distritos, setDistritos] = useState([]);

    const [selectedDpto, setSelectedDpto] = useState('');
    const [selectedProv, setSelectedProv] = useState('');

    const [formData, setFormData] = useState({
        ruc: '',
        nombre_entidad: '',
        poder: 'Privado',
        sector: 'Comercial',
        grupo: '',
        id_distrito: '',
        activo: true
    });

    useEffect(() => {
        if (isOpen) {
            fetchDepartamentos();
            resetForm();
        }
    }, [isOpen]);

    const resetForm = () => {
        setFormData({
            ruc: '',
            nombre_entidad: '',
            poder: 'Privado',
            sector: 'Comercial',
            grupo: '',
            id_distrito: '',
            activo: true
        });
        setSelectedDpto('');
        setSelectedProv('');
        setProvincias([]);
        setDistritos([]);
    };

    const fetchDepartamentos = async () => {
        setGeoLoading(prev => ({ ...prev, dpto: true }));
        try {
            const data = await geoService.getDepartamentos();
            setDepartamentos(data);
        } catch (err) {
            console.error(err);
        } finally {
            setGeoLoading(prev => ({ ...prev, dpto: false }));
        }
    };

    const handleDptoChange = async (e) => {
        const id = e.target.value;
        setSelectedDpto(id);
        setSelectedProv('');
        setDistritos([]);
        setFormData(prev => ({ ...prev, id_distrito: '' }));
        if (id) {
            setGeoLoading(prev => ({ ...prev, prov: true }));
            try {
                const data = await geoService.getProvincias(id);
                setProvincias(data);
            } catch (err) {
                console.error(err);
            } finally {
                setGeoLoading(prev => ({ ...prev, prov: false }));
            }
        } else {
            setProvincias([]);
        }
    };

    const handleProvChange = async (e) => {
        const id = e.target.value;
        setSelectedProv(id);
        setFormData(prev => ({ ...prev, id_distrito: '' }));
        if (id) {
            setGeoLoading(prev => ({ ...prev, dist: true }));
            try {
                const data = await geoService.getDistritos(id);
                setDistritos(data);
            } catch (err) {
                console.error(err);
            } finally {
                setGeoLoading(prev => ({ ...prev, dist: false }));
            }
        } else {
            setDistritos([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await maestroService.create(formData);
            if (onSave) onSave(result);
            onClose();
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 40 }}
                        className="modal-card glass-morphism"
                    >
                        <div className="modal-header">
                            <div className="title-wrap">
                                <div className="icon-box-gradient"><Building2 size={24} color="white" /></div>
                                <div>
                                    <h3>Registrar Cliente Nuevo</h3>
                                    <p>Ingreso al Maestro de Entidades y Cartera.</p>
                                </div>
                            </div>
                            <button className="close-btn" onClick={onClose}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-body custom-scrollbar">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>RUC / DNI <span className="req">*</span></label>
                                    <div className="input-with-icon-premium">
                                        <FileText size={18} />
                                        <input
                                            type="text"
                                            placeholder="2060..."
                                            maxLength={11}
                                            value={formData.ruc}
                                            onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Nombre / Razón Social <span className="req">*</span></label>
                                    <div className="input-with-icon-premium">
                                        <Building size={18} />
                                        <input
                                            type="text"
                                            placeholder="Nombre de la empresa..."
                                            value={formData.nombre_entidad}
                                            onChange={(e) => setFormData({ ...formData, nombre_entidad: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Poder</label>
                                    <div className="input-with-icon-premium">
                                        <CheckCircle size={18} />
                                        <select
                                            value={formData.poder}
                                            onChange={(e) => setFormData({ ...formData, poder: e.target.value })}
                                        >
                                            <option value="Privado">Privado</option>
                                            <option value="Público">Público</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Sector / Categoría</label>
                                    <div className="input-with-icon-premium">
                                        <Building size={18} />
                                        <select
                                            value={formData.sector}
                                            onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                                        >
                                            <option value="Comercial">Comercial</option>
                                            <option value="Educación">Educación</option>
                                            <option value="Salud">Salud</option>
                                            <option value="Minería">Minería</option>
                                            <option value="Construcción">Construcción</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-section-divider">
                                    <div className="divider-line"></div>
                                    <span>Ubicación Geográfica</span>
                                    <div className="divider-line"></div>
                                </div>

                                <div className="form-group">
                                    <label>Departamento</label>
                                    <div className="input-with-icon-premium">
                                        <Map size={18} />
                                        <select value={selectedDpto} onChange={handleDptoChange} required>
                                            <option value="">{geoLoading.dpto ? 'Cargando...' : 'Seleccione...'}</option>
                                            {departamentos.map(d => (
                                                <option key={d.id_departamento} value={d.id_departamento}>{d.nombre}</option>
                                            ))}
                                        </select>
                                        {geoLoading.dpto && <div className="spinner-mini"></div>}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Provincia</label>
                                    <div className="input-with-icon-premium">
                                        <Map size={18} />
                                        <select value={selectedProv} onChange={handleProvChange} required disabled={!selectedDpto || geoLoading.prov}>
                                            <option value="">{geoLoading.prov ? 'Cargando...' : 'Seleccione...'}</option>
                                            {provincias.map(p => (
                                                <option key={p.id_provincia} value={p.id_provincia}>{p.nombre}</option>
                                            ))}
                                        </select>
                                        {geoLoading.prov && <div className="spinner-mini"></div>}
                                    </div>
                                </div>

                                <div className="form-group full">
                                    <label>Distrito</label>
                                    <div className="input-with-icon-premium">
                                        <MapPin size={18} />
                                        <select
                                            value={formData.id_distrito}
                                            onChange={(e) => setFormData({ ...formData, id_distrito: e.target.value })}
                                            required
                                            disabled={!selectedProv || geoLoading.dist}
                                        >
                                            <option value="">{geoLoading.dist ? 'Cargando...' : 'Seleccione Distrito...'}</option>
                                            {distritos.map(d => (
                                                <option key={d.id_distrito} value={d.id_distrito}>{d.nombre}</option>
                                            ))}
                                        </select>
                                        {geoLoading.dist && <div className="spinner-mini"></div>}
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer-premium">
                                <button type="button" className="btn-cancel-glass" onClick={onClose}>Cancelar</button>
                                <button type="submit" className="btn-save-morph" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <div className="spinner-white"></div>
                                            <span>Procesando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={18} />
                                            <span>Registrar Cliente</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .modal-overlay {
                    position: fixed; inset: 0; background: rgba(15, 23, 42, 0.75);
                    backdrop-filter: blur(12px); display: flex; align-items: center;
                    justify-content: center; z-index: 5000; padding: 1.5rem;
                }
                .modal-card {
                    width: 100%; max-width: 680px; background: var(--bg-panel); border-radius: 32px;
                    display: flex; flex-direction: column; overflow: hidden;
                    box-shadow: var(--shadow-premium); border: 1px solid var(--border-subtle);
                }
                .modal-header {
                    padding: 2rem 2.5rem; border-bottom: 1px solid var(--border-subtle);
                    display: flex; justify-content: space-between; align-items: center; background: var(--bg-app);
                }
                .title-wrap { display: flex; align-items: center; gap: 20px; }
                .icon-box-gradient {
                    width: 54px; height: 54px; background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
                    border-radius: 16px; display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.3);
                }
                .title-wrap h3 { font-size: 1.4rem; font-weight: 800; color: var(--text-heading); line-height: 1; margin-bottom: 6px; }
                .title-wrap p { font-size: 0.95rem; color: var(--text-muted); font-weight: 500; }
                
                .close-btn { 
                    background: var(--bg-app); border: none; color: var(--text-muted); cursor: pointer; 
                    width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .close-btn:hover { background: #fee2e2; color: #ef4444; transform: rotate(90deg); }

                .modal-body { padding: 2.5rem; overflow-y: auto; max-height: 75vh; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 10px; }

                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                .form-group.full { grid-column: span 2; }
                
                .form-section-divider { 
                    grid-column: span 2; display: flex; align-items: center; gap: 15px; margin: 1.5rem 0 0.5rem 0;
                }
                .form-section-divider span { font-size: 0.75rem; font-weight: 900; color: var(--primary); text-transform: uppercase; letter-spacing: 2px; white-space: nowrap; }
                .divider-line { height: 1px; flex: 1; background: linear-gradient(90deg, transparent, var(--border-subtle), transparent); }

                .form-group label { display: block; font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; padding-left: 2px; }
                .req { color: #f43f5e; font-weight: 900; margin-left: 2px; }
                
                .input-with-icon-premium {
                    position: relative; display: flex; align-items: center;
                    background: var(--bg-app); border: 2px solid var(--border-subtle); border-radius: 16px;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .input-with-icon-premium:focus-within { border-color: var(--primary); box-shadow: 0 10px 20px -5px var(--primary-glow); background: var(--bg-panel); transform: translateY(-1px); }
                .input-with-icon-premium svg { position: absolute; left: 16px; color: var(--text-muted); pointer-events: none; }
                .input-with-icon-premium input, .input-with-icon-premium select {
                    width: 100%; height: 54px; background: none; border: none; padding: 0 1rem 0 50px;
                    font-size: 1rem; font-weight: 600; color: var(--text-heading); outline: none;
                }
                .input-with-icon-premium select { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 16px center; }
                .input-with-icon-premium select:disabled { opacity: 0.5; cursor: not-allowed; }

                .spinner-mini {
                    position: absolute; right: 44px; width: 14px; height: 14px;
                    border: 2px solid var(--border-subtle); border-top-color: var(--primary); border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                .modal-footer-premium {
                    margin-top: 2.5rem; display: flex; justify-content: flex-end; gap: 15px; align-items: center;
                }
                .btn-cancel-glass {
                    padding: 1rem 2rem; border-radius: 16px; border: 1.5px solid var(--border-subtle);
                    background: var(--bg-app); color: var(--text-muted); font-weight: 700; cursor: pointer; transition: all 0.2s;
                    font-size: 0.95rem;
                }
                .btn-cancel-glass:hover { background: var(--bg-panel); color: var(--text-heading); border-color: var(--text-muted); }
                
                .btn-save-morph {
                    padding: 1rem 2.5rem; border-radius: 16px; border: none;
                    background: var(--bg-sidebar); color: white; font-weight: 700; cursor: pointer; transition: all 0.3s;
                    display: flex; align-items: center; gap: 12px; font-size: 0.95rem;
                    box-shadow: var(--shadow-md);
                }
                .btn-save-morph:hover:not(:disabled) { transform: translateY(-3px); box-shadow: var(--shadow-lg); background: #1e293b; }
                .btn-save-morph:active { transform: translateY(-1px); }
                .btn-save-morph:disabled { opacity: 0.7; cursor: wait; }

                .spinner-white {
                    width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.2);
                    border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite;
                }

                @keyframes spin { to { transform: rotate(360deg); } }

                @media (max-width: 640px) {
                    .modal-card { border-radius: 0; height: 100vh; max-height: 100vh; }
                    .form-grid { grid-template-columns: 1fr; }
                    .form-group.full { grid-column: span 1; }
                    .modal-footer-premium { flex-direction: column-reverse; width: 100%; }
                    .modal-footer-premium button { width: 100%; }
                }
            `}</style>
        </div>
    );
};

export default NuevoClienteModal;
