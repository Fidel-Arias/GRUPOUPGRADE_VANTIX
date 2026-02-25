import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clienteService } from '../../services/api';
import ClienteModal from './ClienteModal';
import NuevoClienteModal from './NuevoClienteModal';
import {
  Building2,
  Search,
  Upload,
  Edit2,
  Phone,
  CheckCircle,
  MapPin,
  AlertCircle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const CarteraList = () => {
  const [clientes, setClientes] = useState([]);
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
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      // Ampliamos el límite para cargar la cartera completa (367 registros actuales)
      const data = await clienteService.getAll(0, 500);
      setClientes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory]);

  const handleSaveCliente = async (formData) => {
    if (selectedCliente) {
      await clienteService.update(selectedCliente.id_cliente, formData);
      fetchClientes();
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
      fetchClientes();
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
    return matchesSearch && c.categoria === filterCategory;
  });

  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredClientes.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="cartera-container">
      <div className="section-header">
        <div className="title-group">
          <h2>Cartera de Clientes</h2>
          <p>Base de datos oficial de clientes y prospectos corporativos.</p>
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

      <div className="table-controls card-premium">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por cliente, RUC o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
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
      </div>

      <div className="table-wrapper card-premium">
        {loading && !clientes.length ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando cartera oficial...</p>
          </div>
        ) : (
          <>
            <div className="table-scroll">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th><span className="hide-mobile">Cliente / Entidad</span><span className="show-mobile-only">Cliente</span></th>
                    <th className="hide-mobile">Identificación</th>
                    <th className="hide-tablet">Contacto</th>
                    <th className="hide-tablet">Ubicación</th>
                    <th>Cat.</th>
                    <th className="text-right">
                      <span className="hide-mobile">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((c) => (
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
                          <span className={`cat-badge ${c.categoria?.toLowerCase() || 'other'}`}>
                            <span className="badge-full-text">{c.categoria || 'S/C'}</span>
                            <span className="badge-short-text">{(c.categoria || 'S')[0]}</span>
                          </span>
                        </td>
                        <td className="text-right actions-td">
                          <button className="action-icon-btn" onClick={() => handleEdit(c)}>
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="empty-state-cell">
                        <div className="empty-state">
                          <div className="empty-icon-wrap">
                            <FileSpreadsheet size={32} />
                          </div>
                          <p>No hay clientes registrados en esta categoría.</p>
                        </div>
                      </td>
                    </tr>
                  )}
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
      </div>

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
                .cartera-container {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .action-group {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }

                .title-group h2 {
                    font-size: 2rem;
                    font-weight: 800;
                    color: var(--text-heading);
                    letter-spacing: -0.02em;
                }

                .title-group p {
                    color: var(--text-muted);
                    font-size: 1rem;
                }

                .status-banner {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 1rem 1.5rem;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 0.9rem;
                }

                .status-banner.success { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
                .status-banner.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
                .status-banner.info { background: var(--primary-glow); color: var(--primary); border: 1px solid var(--primary-soft); }

                .btn-primary {
                    padding: 0.75rem 1.5rem;
                    background: var(--bg-sidebar);
                    border: none;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-weight: 700;
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: var(--shadow-md);
                }

                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-lg);
                }

                .btn-secondary {
                    padding: 0.75rem 1.5rem;
                    background: var(--bg-panel);
                    border: 1px solid var(--border-subtle);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-weight: 700;
                    color: var(--text-heading);
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: var(--shadow-sm);
                }

                .btn-secondary:hover:not(:disabled) {
                    border-color: var(--primary);
                    color: var(--primary);
                    background: var(--bg-app);
                    transform: translateY(-2px);
                }

                .table-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 1.5rem;
                }

                .search-box {
                    display: flex;
                    align-items: center;
                    background: var(--bg-app);
                    border: 1px solid var(--border-subtle);
                    border-radius: 12px;
                    padding: 0 1rem;
                    width: 380px;
                    height: 44px;
                    transition: var(--transition);
                }

                .search-box:focus-within {
                    background: var(--bg-panel);
                    border-color: var(--primary);
                    box-shadow: 0 0 0 4px var(--primary-soft);
                }

                .search-box input {
                    border: none;
                    background: none;
                    outline: none;
                    width: 100%;
                    font-size: 0.9rem;
                    margin-left: 10px;
                    color: var(--text-heading);
                    font-family: inherit;
                }

                .filter-tabs {
                    display: flex;
                    background: var(--bg-app);
                    padding: 4px;
                    border-radius: 10px;
                    border: 1px solid var(--border-subtle);
                }

                .filter-tab {
                    padding: 6px 16px;
                    border: none;
                    background: none;
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: var(--text-muted);
                    cursor: pointer;
                    border-radius: 8px;
                    transition: all 0.2s;
                }

                .filter-tab.active {
                    background: var(--bg-panel);
                    color: var(--primary);
                    box-shadow: var(--shadow-sm);
                }

                .table-wrapper {
                    padding: 0;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .table-scroll {
                    overflow-x: auto;
                }

                .custom-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .custom-table th {
                    background: var(--bg-app);
                    padding: 1rem 1.5rem;
                    text-align: left;
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    border-bottom: 1px solid var(--border-subtle);
                }

                .custom-table td {
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid var(--border-light);
                    color: var(--text-body);
                }

                .client-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .client-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .client-icon.corporativo { background: var(--primary-soft); color: var(--primary); }
                .client-icon.gobierno { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
                .client-icon.retail { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .client-icon.default { background: var(--bg-app); color: var(--text-muted); }

                .client-text {
                    display: flex;
                    flex-direction: column;
                }

                .client-name {
                    font-weight: 700;
                    color: var(--text-heading);
                    font-size: 0.95rem;
                }

                .last-visit {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }

                .ruc-tag {
                    font-family: monospace;
                    background: var(--bg-app);
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-heading);
                    border: 1px solid var(--border-subtle);
                }

                .contact-mini {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .contact-name {
                    font-weight: 600;
                    font-size: 0.85rem;
                    color: var(--text-heading);
                }

                .contact-row.secondary {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }

                .location-info {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    max-width: 250px;
                }

                .location-icon {
                    color: var(--text-muted);
                    margin-top: 2px;
                    flex-shrink: 0;
                }

                .location-text {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    overflow: hidden;
                }

                .address {
                    font-size: 0.85rem;
                    color: var(--text-body);
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .district {
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: var(--primary);
                    text-transform: uppercase;
                    letter-spacing: 0.02em;
                }

                .cat-badge {
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 800;
                }

                .cat-badge.corporativo { background: var(--primary-soft); color: var(--primary); }
                .cat-badge.gobierno { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
                .cat-badge.retail { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .cat-badge.other { background: var(--bg-app); color: var(--text-muted); }

                .action-icon-btn {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    border: 1px solid var(--border-subtle);
                    background: var(--bg-panel);
                    color: var(--text-muted);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .action-icon-btn:hover {
                    border-color: var(--primary);
                    color: var(--primary);
                    background: var(--bg-app);
                }

                .empty-state-cell {
                    padding: 4rem 0;
                }

                .empty-icon-wrap {
                    width: 64px;
                    height: 64px;
                    background: var(--bg-app);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 0.5rem;
                    color: var(--text-muted);
                }

                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    padding: 2rem;
                    gap: 0.5rem;
                    color: var(--text-muted);
                }

                .empty-state p {
                    font-size: 0.9rem;
                    max-width: 200px;
                    line-height: 1.4;
                    font-weight: 500;
                }

                .pagination-footer {
                    padding: 1rem 1.5rem;
                    background: var(--bg-app);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-top: 1px solid var(--border-subtle);
                }

                .page-info {
                    font-size: 0.9rem;
                    color: var(--text-muted);
                }

                .results-count {
                    margin-left: 8px;
                    font-size: 0.8rem;
                    opacity: 0.7;
                }

                .pagination-btns {
                    display: flex;
                    gap: 0.5rem;
                }

                .pag-btn {
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    border: 1px solid var(--border-subtle);
                    background: var(--bg-panel);
                    color: var(--text-heading);
                    font-weight: 600;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .pag-btn:hover:not(:disabled) {
                    border-color: var(--primary);
                    color: var(--primary);
                    background: var(--bg-app);
                }

                .pag-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .tab-short-text { display: none; }
                .badge-short-text { display: none; }

                .show-mobile-only { display: none; }

                @media (max-width: 1024px) {
                    .section-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }
                    .action-group {
                        width: 100%;
                    }
                    .action-group button {
                        flex: 1;
                    }
                    .table-controls {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 1rem;
                        padding: 1.25rem 1rem;
                    }
                    .search-box {
                        width: 100%;
                    }
                    .filter-group {
                        overflow-x: auto;
                        padding-bottom: 4px;
                    }
                    .filter-tabs {
                        min-width: max-content;
                    }
                    .hide-tablet {
                        display: none;
                    }
                    .custom-table {
                        min-width: 600px;
                    }
                }

                @media (max-width: 640px) {
                    .title-group h2 {
                        font-size: 1.5rem;
                    }
                    .btn-text {
                        display: none;
                    }
                    .btn-primary, .btn-secondary {
                        padding: 0.75rem;
                        width: 44px;
                        justify-content: center;
                    }
                    .action-group {
                        width: auto;
                        position: fixed;
                        bottom: 1.5rem;
                        right: 1.5rem;
                        flex-direction: column;
                        z-index: 100;
                        gap: 10px;
                    }
                    .btn-primary, .btn-secondary {
                        width: 50px;
                        height: 50px;
                        border-radius: 50%;
                        box-shadow: 0 10px 25px rgba(15, 23, 42, 0.4);
                    }
                    .btn-primary { background: var(--bg-sidebar); color: white; }
                    .btn-secondary { background: var(--bg-panel); border: 1px solid var(--border-subtle); }
                    
                    .hide-mobile {
                        display: none;
                    }
                    .show-mobile-only { display: block; }
                    .tab-full-text { display: none; }
                    .tab-short-text { display: block; }
                    .badge-full-text { display: none; }
                    .badge-short-text { display: block; }
                    
                    .cat-badge {
                        width: 24px;
                        height: 24px;
                        padding: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .pag-text { display: none; }
                    .pagination-footer { padding: 1rem; }
                    .empty-state-cell {
                        padding: 2.5rem 0;
                    }

                    .empty-state {
                        transform: none;
                        padding: 0;
                        width: 100%;
                    }

                    .empty-icon-wrap {
                        width: 48px;
                        height: 48px;
                    }

                    .client-info {
                        min-width: 140px;
                    }
                    
                    .custom-table {
                        min-width: 100%;
                        table-layout: fixed;
                    }
                    
                    .cliente-td { width: 60%; }
                    .cat-td { width: 30%; }
                    .actions-td { width: 10%; }

                    .custom-table th, .custom-table td {
                        overflow: hidden;
                        text-overflow: ellipsis;
                        padding: 1rem 0.5rem;
                    }

                    .table-scroll {
                        overflow-x: hidden;
                    }

                    .filter-tab {
                        padding: 8px 12px;
                        font-size: 0.9rem;
                    }
                }

                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
    </div>
  );
};

export default CarteraList;
