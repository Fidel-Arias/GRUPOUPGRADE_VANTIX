import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clienteService } from '../../services/api';
import ClienteModal from './ClienteModal';
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
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".xlsx, .xls"
            onChange={handleFileChange}
          />
          <button className="btn-secondary" onClick={handleImportClick} disabled={loading}>
            <Upload size={18} />
            <span>Importar Excel</span>
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
                {cat.charAt(0) + cat.slice(1).toLowerCase()}
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
                    <th>Cliente / Entidad</th>
                    <th>Identificación</th>
                    <th>Contacto</th>
                    <th>Ubicación</th>
                    <th>Cat.</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((c) => (
                      <tr key={c.id_cliente}>
                        <td>
                          <div className="client-info">
                            <div className={`client-icon ${c.categoria?.toLowerCase() || 'default'}`}>
                              <Building2 size={18} />
                            </div>
                            <div className="client-text">
                              <span className="client-name">{c.nombre_cliente}</span>
                              <span className="last-visit">
                                Última visita: {c.fecha_ultima_visita || 'Sin registro'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td><span className="ruc-tag">{c.ruc_dni}</span></td>
                        <td>
                          <div className="contact-mini">
                            <div className="contact-name">{c.nombre_contacto || 'No asignado'}</div>
                            <div className="contact-row secondary">
                              <Phone size={12} />
                              <span>{c.celular_contacto || '-'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
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
                        <td>
                          <span className={`cat-badge ${c.categoria?.toLowerCase() || 'other'}`}>
                            {c.categoria || 'S/C'}
                          </span>
                        </td>
                        <td className="text-right">
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
                          <FileSpreadsheet size={48} />
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
                  Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
                  <span className="results-count">({filteredClientes.length} clientes)</span>
                </div>
                <div className="pagination-btns">
                  <button
                    className="pag-btn"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={18} />
                    Anterior
                  </button>
                  <button
                    className="pag-btn"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
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

      <style jsx>{`
                .cartera-container {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                }

                .title-group h2 {
                    font-size: 2rem;
                    font-weight: 800;
                    color: #1e293b;
                    letter-spacing: -0.02em;
                }

                .title-group p {
                    color: #64748b;
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

                .status-banner.success { background: #ecfdf5; color: #059669; border: 1px solid #d1fae5; }
                .status-banner.error { background: #fef2f2; color: #dc2626; border: 1px solid #fee2e2; }
                .status-banner.info { background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; }

                .btn-secondary {
                    padding: 0.75rem 1.5rem;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-weight: 700;
                    color: #1e293b;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                }

                .btn-secondary:hover:not(:disabled) {
                    border-color: #0ea5e9;
                    color: #0ea5e9;
                    background: #f0f9ff;
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
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 0 1rem;
                    width: 380px;
                    height: 44px;
                }

                .search-box input {
                    border: none;
                    background: none;
                    outline: none;
                    width: 100%;
                    font-size: 0.9rem;
                    margin-left: 10px;
                }

                .filter-tabs {
                    display: flex;
                    background: #f1f5f9;
                    padding: 4px;
                    border-radius: 10px;
                }

                .filter-tab {
                    padding: 6px 16px;
                    border: none;
                    background: none;
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: #64748b;
                    cursor: pointer;
                    border-radius: 8px;
                    transition: all 0.2s;
                }

                .filter-tab.active {
                    background: white;
                    color: #0ea5e9;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
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
                    background: #f8fafc;
                    padding: 1rem 1.5rem;
                    text-align: left;
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: #64748b;
                    text-transform: uppercase;
                    border-bottom: 1px solid #f1f5f9;
                }

                .custom-table td {
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid #f1f5f9;
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

                .client-icon.corporativo { background: #e0f2fe; color: #0369a1; }
                .client-icon.gobierno { background: #fef3c7; color: #92400e; }
                .client-icon.retail { background: #dcfce7; color: #166534; }
                .client-icon.default { background: #f1f5f9; color: #64748b; }

                .client-text {
                    display: flex;
                    flex-direction: column;
                }

                .client-name {
                    font-weight: 700;
                    color: #1e293b;
                    font-size: 0.95rem;
                }

                .last-visit {
                    font-size: 0.75rem;
                    color: #94a3b8;
                }

                .ruc-tag {
                    font-family: monospace;
                    background: #f1f5f9;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #475569;
                }

                .contact-mini {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .contact-name {
                    font-weight: 600;
                    font-size: 0.85rem;
                    color: #1e293b;
                }

                .contact-row.secondary {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.75rem;
                    color: #64748b;
                }

                .location-info {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    max-width: 250px;
                }

                .location-icon {
                    color: #94a3b8;
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
                    color: #475569;
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .district {
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: #0ea5e9;
                    text-transform: uppercase;
                    letter-spacing: 0.02em;
                }

                .cat-badge {
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 800;
                }

                .cat-badge.corporativo { background: #e0f2fe; color: #0369a1; }
                .cat-badge.gobierno { background: #fef3c7; color: #92400e; }
                .cat-badge.retail { background: #dcfce7; color: #166534; }
                .cat-badge.other { background: #f1f5f9; color: #64748b; }

                .action-icon-btn {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                    background: white;
                    color: #64748b;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .action-icon-btn:hover {
                    border-color: #0ea5e9;
                    color: #0ea5e9;
                    background: #f0f9ff;
                }

                .empty-state-cell {
                    padding: 4rem 0;
                }

                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                    color: #94a3b8;
                }

                .pagination-footer {
                    padding: 1rem 1.5rem;
                    background: #f8fafc;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-top: 1px solid #f1f5f9;
                }

                .page-info {
                    font-size: 0.9rem;
                    color: #64748b;
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
                    border: 1px solid #e2e8f0;
                    background: white;
                    color: #1e293b;
                    font-weight: 600;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .pag-btn:hover:not(:disabled) {
                    border-color: #0ea5e9;
                    color: #0ea5e9;
                    background: #f0f9ff;
                }

                .pag-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .spinner {
                    width: 30px;
                    height: 30px;
                    border: 3px solid #f1f5f9;
                    border-top-color: #0ea5e9;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
    </div>
  );
};

export default CarteraList;
