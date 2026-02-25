import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clienteService, empleadoService } from '../../services/api';
import ClienteModal from './ClienteModal';
import NuevoClienteModal from './NuevoClienteModal';
import PremiumCard from '../Common/PremiumCard';
import Badge from '../Common/Badge';
import SearchInput from '../Common/SearchInput';
import LoadingSpinner from '../Common/LoadingSpinner';
import EmptyState from '../Common/EmptyState';
import AsesorCard from './AsesorCard';
import {
  Building2,
  Upload,
  Edit2,
  Phone,
  CheckCircle,
  MapPin,
  AlertCircle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  ArrowLeft
} from 'lucide-react';

const CarteraList = () => {
  const [clientes, setClientes] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [selectedVendedor, setSelectedVendedor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [isNuevoModalOpen, setIsNuevoModalOpen] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, selectedVendedor]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [empleadosData, todosClientes] = await Promise.all([
        empleadoService.getAll(),
        clienteService.getAll(0, 1000)
      ]);

      const resumen = empleadosData
        .filter(emp => !emp.is_admin) // Hide administrators
        .map(emp => ({
          id_empleado: emp.id_empleado,
          nombre_completo: emp.nombre_completo,
          cargo: emp.cargo,
          total_clientes: todosClientes.filter(c => c.id_empleado === emp.id_empleado).length
        })).sort((a, b) => b.total_clientes - a.total_clientes);

      setVendedores(resumen);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientes = async (idVendedor = null) => {
    try {
      setLoading(true);
      const data = await clienteService.getAll(0, 500, idVendedor);
      setClientes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVendedorSelect = (vendedor) => {
    setSelectedVendedor(vendedor);
    fetchClientes(vendedor.id_empleado);
  };

  const handleBack = () => {
    setSelectedVendedor(null);
    setClientes([]);
    fetchInitialData();
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory]);

  const handleSaveCliente = async (formData) => {
    if (selectedCliente) {
      await clienteService.update(selectedCliente.id_cliente, formData);
      fetchClientes(selectedVendedor?.id_empleado);
    }
  };

  const handleEdit = (cliente) => {
    setSelectedCliente(cliente);
    setIsModalOpen(true);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      setImportStatus({ type: 'info', message: 'Procesando archivo Excel...' });
      const result = await clienteService.importMasivo(file);
      setImportStatus({
        type: 'success',
        message: `¡Éxito! Insertados: ${result.registros_insertados}, Omitidos: ${result.registros_omitidos_o_duplicados}`
      });
      if (selectedVendedor) {
        fetchClientes(selectedVendedor.id_empleado);
      } else {
        fetchInitialData();
      }
    } catch (error) {
      setImportStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
      e.target.value = '';
      setTimeout(() => setImportStatus(null), 5000);
    }
  };

  const filteredClientes = clientes.filter(c => {
    const matchesSearch =
      c.nombre_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.ruc_dni?.includes(searchTerm);

    if (filterCategory === 'TODOS') return matchesSearch;
    return matchesSearch && c.categoria?.toUpperCase() === filterCategory;
  });

  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredClientes.slice(indexOfFirstItem, indexOfLastItem);

  const getCatVariant = (cat) => {
    const upperCat = cat?.toUpperCase();
    switch (upperCat) {
      case 'CORPORATIVO': return 'primary';
      case 'GOBIERNO': return 'warning';
      case 'RETAIL': return 'success';
      default: return 'default';
    }
  };

  return (
    <div className="cartera-container">
      <div className="section-header">
        <div className="title-group">
          <div className="title-with-back">
            {selectedVendedor && (
              <button className="back-btn-round" onClick={handleBack}>
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              <h2>{selectedVendedor ? `Clientes de ${selectedVendedor.nombre_completo}` : 'Cartera de Clientes'}</h2>
              <p>{selectedVendedor ? `Visualizando la cartera asignada a ${selectedVendedor.cargo}.` : 'Base de datos oficial de clientes y prospectos corporativos.'}</p>
            </div>
          </div>
        </div>
        <div className="action-group">
          <button className="btn-primary" onClick={() => setIsNuevoModalOpen(true)}>
            <Building2 size={18} />
            <span className="btn-text">Nuevo Cliente</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".xlsx, .xls"
            onChange={handleFileChange}
          />
          <button className="btn-secondary" onClick={handleImportClick} disabled={loading}>
            <Upload size={18} />
            <span className="btn-text">Importar Excel</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {importStatus && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`status-banner ${importStatus.type}`}
          >
            {importStatus.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{importStatus.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedVendedor ? (
        <div className="vendedores-grid">
          {loading && !vendedores.length ? (
            <LoadingSpinner message="Cargando resumen de asesores..." />
          ) : (
            vendedores.map((v, idx) => (
              <AsesorCard
                key={v.id_empleado}
                v={v}
                idx={idx}
                onClick={() => handleVendedorSelect(v)}
              />
            ))
          )}
        </div>
      ) : (
        <>
          <PremiumCard className="table-controls" hover={false}>
            <SearchInput
              placeholder="Buscar por cliente, RUC o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="filter-group">
              <div className="filter-tabs">
                {['TODOS', 'CORPORATIVO', 'GOBIERNO', 'RETAIL'].map(cat => (
                  <button
                    key={cat}
                    className={`filter-tab ${filterCategory === cat ? 'active' : ''}`}
                    onClick={() => setFilterCategory(cat)}
                  >
                    <span className="tab-full-text">{cat.charAt(0) + cat.slice(1).toLowerCase()}</span>
                    <span className="tab-short-text">{cat === 'TODOS' ? 'T' : cat.charAt(0)}</span>
                  </button>
                ))}
              </div>
            </div>
          </PremiumCard>

          <PremiumCard className="table-wrapper" hover={false}>
            {loading ? (
              <LoadingSpinner message="Cargando cartera oficial..." />
            ) : filteredClientes.length === 0 ? (
              <EmptyState
                icon={FileSpreadsheet}
                title="Sin Resultados"
                message="No se encontraron clientes registrados en esta categoría que coincidan con la búsqueda."
                actionLabel="Crear Nuevo Cliente"
                onAction={() => setIsNuevoModalOpen(true)}
              />
            ) : (
              <>
                <div className="table-scroll">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Cliente / Entidad</th>
                        <th className="hide-mobile">Id. Fiscal</th>
                        <th className="hide-tablet">Contacto</th>
                        <th className="hide-tablet">Ubicación</th>
                        <th>Categoría</th>
                        <th className="text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((c) => (
                        <tr key={c.id_cliente}>
                          <td className="cliente-td">
                            <div className="client-info">
                              <div className={`client-icon ${c.categoria?.toLowerCase() || 'default'}`}>
                                <Building2 size={18} />
                              </div>
                              <div className="client-text">
                                <span className="client-name">{c.nombre_cliente}</span>
                                <span className="last-visit hide-mobile">
                                  Última visita: {c.fecha_ultima_visita || 'Sin registro'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="hide-mobile"><span className="ruc-tag">{c.ruc_dni}</span></td>
                          <td className="hide-tablet">
                            <div className="contact-mini">
                              <div className="contact-name">{c.nombre_contacto || 'No asignado'}</div>
                              <div className="contact-row secondary">
                                <Phone size={12} />
                                <span>{c.celular_contacto || '-'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="hide-tablet">
                            <div className="location-info">
                              <MapPin size={14} className="location-icon" />
                              <div className="location-text">
                                <span className="address" title={c.direccion}>{c.direccion || 'N/A'}</span>
                                {c.distrito?.nombre_distrito && (
                                  <span className="district">{c.distrito.nombre_distrito}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="cat-td">
                            <Badge variant={getCatVariant(c.categoria)}>
                              {c.categoria || 'S/C'}
                            </Badge>
                          </td>
                          <td className="text-right actions-td">
                            <button className="action-icon-btn" onClick={() => handleEdit(c)}>
                              <Edit2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="pagination-footer">
                    <div className="page-info">
                      <span className="p-text">Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong></span>
                      <span className="results-count hide-mobile">({filteredClientes.length} clientes)</span>
                    </div>
                    <div className="pagination-btns">
                      <button
                        className="pag-btn"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft size={18} />
                        <span className="pag-text">Anterior</span>
                      </button>
                      <button
                        className="pag-btn"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <span className="pag-text">Siguiente</span>
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </PremiumCard>
        </>
      )}

      <ClienteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCliente}
        cliente={selectedCliente}
      />

      <NuevoClienteModal
        isOpen={isNuevoModalOpen}
        onClose={() => setIsNuevoModalOpen(false)}
        onSave={() => {
          fetchClientes();
          setImportStatus({ type: 'success', message: '¡Cliente registrado correctamente en el Maestro y Cartera!' });
          setTimeout(() => setImportStatus(null), 5000);
        }}
      />

      <style jsx>{`
                .cartera-container { display: flex; flex-direction: column; gap: 1.5rem; }
                .section-header { display: flex; justify-content: space-between; align-items: center; }
                .action-group { display: flex; gap: 12px; align-items: center; }
                .title-group h2 { font-size: 2rem; font-weight: 800; color: var(--text-heading); letter-spacing: -0.02em; }
                .title-group p { color: var(--text-muted); font-size: 1rem; }

                .title-with-back { display: flex; align-items: center; gap: 1.5rem; }
                .back-btn-round {
                    width: 48px; height: 48px; border-radius: 50%; border: 1.5px solid var(--border-subtle);
                    background: var(--bg-panel); color: var(--text-muted); display: flex; align-items: center;
                    justify-content: center; cursor: pointer; transition: all 0.2s;
                }
                .back-btn-round:hover { border-color: var(--primary); color: var(--primary); background: var(--bg-app); transform: translateX(-4px); }

                .vendedores-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
                    gap: 1.5rem; 
                    padding: 0.5rem;
                }
                
                :global(.asesor-pro-card) { 
                    height: 100%;
                }

                .status-banner { display: flex; align-items: center; gap: 12px; padding: 1rem 1.5rem; border-radius: 12px; font-weight: 600; font-size: 0.9rem; }
                .status-banner.success { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
                .status-banner.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
                .status-banner.info { background: var(--primary-glow); color: var(--primary); border: 1px solid var(--primary-soft); }

                .btn-primary { 
                    padding: 0.75rem 1.5rem; background: var(--bg-sidebar); border: none; border-radius: 12px;
                    display: flex; align-items: center; gap: 10px; font-weight: 700; color: white; cursor: pointer; transition: all 0.2s;
                    box-shadow: var(--shadow-md); 
                }
                .btn-primary:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }

                .btn-secondary {
                    padding: 0.75rem 1.5rem; background: var(--bg-panel); border: 1px solid var(--border-subtle); border-radius: 12px;
                    display: flex; align-items: center; gap: 10px; font-weight: 700; color: var(--text-heading); cursor: pointer; transition: all 0.2s;
                    box-shadow: var(--shadow-sm);
                }
                .btn-secondary:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); background: var(--bg-app); transform: translateY(-2px); }

                .table-controls { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; }

                .filter-tabs { display: flex; background: var(--bg-app); padding: 4px; border-radius: 10px; border: 1px solid var(--border-subtle); }
                .filter-tab { padding: 6px 16px; border: none; background: none; font-size: 0.8rem; font-weight: 700; color: var(--text-muted); cursor: pointer; border-radius: 8px; transition: all 0.2s; }
                .filter-tab.active { background: var(--bg-panel); color: var(--primary); box-shadow: var(--shadow-sm); }

                .table-wrapper { padding: 0; overflow: hidden; display: flex; flex-direction: column; }
                .table-scroll { overflow-x: auto; }
                .custom-table { width: 100%; border-collapse: collapse; }
                .custom-table th { background: var(--bg-app); padding: 1rem 1.5rem; text-align: left; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; border-bottom: 1px solid var(--border-subtle); }
                .custom-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-light); color: var(--text-body); }

                .client-info { display: flex; align-items: center; gap: 12px; }
                .client-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
                .client-icon.corporativo { background: var(--primary-soft); color: var(--primary); }
                .client-icon.gobierno { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
                .client-icon.retail { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .client-icon.default { background: var(--bg-app); color: var(--text-muted); }

                .client-text { display: flex; flex-direction: column; }
                .client-name { font-weight: 700; color: var(--text-heading); font-size: 0.95rem; }
                .last-visit { font-size: 0.75rem; color: var(--text-muted); }

                .ruc-tag { font-family: monospace; background: var(--bg-app); padding: 4px 8px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; color: var(--text-heading); border: 1px solid var(--border-subtle); }

                .contact-mini { display: flex; flex-direction: column; gap: 2px; }
                .contact-name { font-weight: 600; font-size: 0.85rem; color: var(--text-heading); }
                .contact-row.secondary { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--text-muted); }

                .location-info { display: flex; align-items: flex-start; gap: 8px; max-width: 250px; }
                .location-icon { color: var(--text-muted); margin-top: 2px; flex-shrink: 0; }
                .location-text { display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
                .address { font-size: 0.85rem; color: var(--text-body); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .district { font-size: 0.7rem; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.02em; }

                .action-icon-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-subtle); background: var(--bg-panel); color: var(--text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
                .action-icon-btn:hover { border-color: var(--primary); color: var(--primary); background: var(--bg-app); }

                .pagination-footer { padding: 1rem 1.5rem; background: var(--bg-app); display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); }
                .page-info { font-size: 0.9rem; color: var(--text-muted); }
                .pagination-btns { display: flex; gap: 0.5rem; }
                .pag-btn { padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid var(--border-subtle); background: var(--bg-panel); color: var(--text-heading); font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s; }
                .pag-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); background: var(--bg-app); }
                .pag-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .tab-short-text { display: none; }
                @media (max-width: 1024px) {
                    .section-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
                    .action-group { width: 100%; }
                    .action-group button { flex: 1; }
                    .table-controls { flex-direction: column; align-items: stretch; gap: 1rem; }
                    .hide-tablet { display: none; }
                    .vendedores-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
                }

                @media (max-width: 640px) {
                    .title-group h2 { font-size: 1.5rem; }
                    .btn-text { display: none; }
                    .btn-primary, .btn-secondary { width: 50px; height: 50px; border-radius: 50%; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.4); }
                    .action-group { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 100; gap: 10px; }
                    .hide-mobile { display: none; }
                    .tab-full-text { display: none; }
                    .tab-short-text { display: block; }
                    .pag-text { display: none; }
                    .vendedores-grid { grid-template-columns: 1fr; }
                    .title-with-back { gap: 1rem; }
                    .back-btn-round { width: 40px; height: 40px; }
                }
            `}</style>
    </div>
  );
};

export default CarteraList;
