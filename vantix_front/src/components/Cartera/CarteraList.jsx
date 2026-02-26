import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clienteService, empleadoService, authService } from '../../services/api';
import ClienteModal from './ClienteModal';
import NuevoClienteModal from './NuevoClienteModal';
import PageHeader from '../Common/PageHeader';
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
  ArrowLeft,
  Briefcase
} from 'lucide-react';

const CarteraList = () => {
  const [user, setUser] = useState(null);
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
    const currentUser = authService.getUser();
    setUser(currentUser);
    fetchInitialData(currentUser);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, selectedVendedor]);

  const fetchInitialData = async (providedUser = null) => {
    const currentUser = providedUser || user || authService.getUser();
    try {
      setLoading(true);

      // If not admin, we skip the advisor selection and go straight to their clients
      if (currentUser && !currentUser.is_admin) {
        setSelectedVendedor(currentUser);
        await fetchClientes(currentUser.id_empleado);
        return;
      }

      const results = await Promise.allSettled([
        empleadoService.getAll(),
        clienteService.getAll(0, 1000)
      ]);

      const empleadosData = results[0].status === 'fulfilled' ? results[0].value : [];
      const todosClientes = results[1].status === 'fulfilled' ? results[1].value : [];

      const resumen = (empleadosData || [])
        .filter(emp => !emp.is_admin) // Hide administrators
        .map(emp => ({
          id_empleado: emp.id_empleado,
          nombre_completo: emp.nombre_completo,
          cargo: emp.cargo,
          total_clientes: (todosClientes || []).filter(c => c.id_empleado === emp.id_empleado).length
        })).sort((a, b) => b.total_clientes - a.total_clientes);

      setVendedores(resumen);
    } catch (error) {
      console.error('Error fetching initial data:', error);
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

  const handleEdit = (cliente) => {
    setSelectedCliente(cliente);
    setIsModalOpen(true);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await clienteService.importExcel(formData);
      setImportStatus({
        type: 'success',
        message: response.message || 'Importación exitosa'
      });
      fetchInitialData();
      if (selectedVendedor) fetchClientes(selectedVendedor.id_empleado);
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: error.message || 'Error al importar archivo'
      });
    } finally {
      setLoading(false);
      setTimeout(() => setImportStatus(null), 5000);
      e.target.value = '';
    }
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const filteredClientes = clientes.filter(c => {
    const term = searchTerm.toLowerCase();
    const name = c.nombre_cliente?.toLowerCase() || '';
    const ruc = c.ruc || '';
    const dni = c.dni || '';

    const matchesSearch = name.includes(term) || ruc.includes(term) || dni.includes(term);

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
      <PageHeader
        title={selectedVendedor ? `Cartera de ${selectedVendedor.nombre_completo.split(' ')[0]}` : 'Cartera de Clientes'}
        description={selectedVendedor ? `Visualizando la cartera asignada a ${selectedVendedor.cargo}.` : 'Base de datos oficial de clientes y prospectos corporativos.'}
        icon={Briefcase}
        breadcrumb={selectedVendedor ? ['Apps', 'Cartera', selectedVendedor.nombre_completo.split(' ')[0]] : ['Apps', 'Cartera']}
        actions={
          <div className="action-group">
            {selectedVendedor && user?.is_admin && (
              <button className="back-btn-elite" onClick={handleBack}>
                <ArrowLeft size={18} />
                <span>Volver</span>
              </button>
            )}
            {user?.is_admin && (
              <>
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
              </>
            )}
          </div>
        }
      />

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

          <PremiumCard className="table-card">
            {loading ? (
              <div className="table-loading">
                <LoadingSpinner message="Consultando clientes..." />
              </div>
            ) : (
              <table className="elite-table">
                <thead>
                  <tr>
                    <th>CLIENTE</th>
                    <th className="hide-mobile">IDENTIFICACIÓN</th>
                    <th className="hide-tablet">CATEGORÍA</th>
                    <th className="hide-tablet">DISTRITO</th>
                    <th>CONTACTO</th>
                    <th className="text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((c) => (
                      <tr key={c.id_cliente}>
                        <td>
                          <div className="client-cell">
                            <div className="client-icon">
                              <Building2 size={18} />
                            </div>
                            <div className="client-info">
                              <span className="client-name">{c.nombre_cliente}</span>
                              <span className="client-segment">{c.segmento || 'Sin Segmento'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="hide-mobile">
                          <span className="id-tag">{c.ruc || c.dni || 'S/I'}</span>
                        </td>
                        <td className="hide-tablet">
                          <Badge variant={getCatVariant(c.categoria)}>
                            {c.categoria || 'NORMAL'}
                          </Badge>
                        </td>
                        <td className="hide-tablet">
                          <div className="geo-item">
                            <MapPin size={14} />
                            <span>{c.distrito || 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="phone-item">
                            <Phone size={14} />
                            <span>{c.celular_contacto || 'S/N'}</span>
                          </div>
                        </td>
                        <td className="text-right">
                          <button className="action-btn-elite" onClick={() => handleEdit(c)}>
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6">
                        <EmptyState
                          icon={Building2}
                          title="Sin clientes"
                          message="No se encontraron clientes que coincidan con la búsqueda."
                          actionLabel="Ver Todos"
                          onAction={() => { setSearchTerm(''); setFilterCategory('TODOS'); }}
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {totalPages > 1 && !loading && (
              <div className="pagination">
                <button
                  className="pag-btn"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="pag-info">
                  Página <span>{currentPage}</span> de {totalPages}
                </div>
                <button
                  className="pag-btn"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </PremiumCard>
        </>
      )}

      <ClienteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cliente={selectedCliente}
        onSuccess={() => fetchClientes(selectedVendedor.id_empleado)}
      />

      <NuevoClienteModal
        isOpen={isNuevoModalOpen}
        onClose={() => setIsNuevoModalOpen(false)}
        onSuccess={() => {
          if (selectedVendedor) fetchClientes(selectedVendedor.id_empleado);
          else fetchInitialData();
        }}
        defaultVendedor={selectedVendedor}
      />

      <style jsx>{`
        .cartera-container { display: flex; flex-direction: column; gap: 1.5rem; }
        
        .action-group { display: flex; gap: 12px; }

        .back-btn-elite {
          display: flex; align-items: center; gap: 8px;
          padding: 0.8rem 1.25rem; border-radius: 14px;
          border: 1px solid var(--border-subtle); background: white;
          color: var(--text-body); font-weight: 700; cursor: pointer;
          transition: all 0.2s;
        }
        .back-btn-elite:hover { border-color: var(--primary); color: var(--primary); transform: translateX(-4px); }
        :global(.dark) .back-btn-elite { background: var(--bg-panel); border-color: var(--border-light); }

        .btn-primary {
          background: var(--bg-sidebar); color: white; padding: 0.8rem 1.5rem; border-radius: 14px;
          border: none; display: flex; align-items: center; gap: 12px; font-weight: 700; cursor: pointer;
          transition: all 0.3s; box-shadow: var(--shadow-md);
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }

        .btn-secondary {
          background: white; border: 1px solid var(--border-subtle); color: var(--text-body);
          padding: 0.8rem 1.5rem; border-radius: 14px; display: flex; align-items: center; gap: 10px;
          font-weight: 700; cursor: pointer; transition: all 0.2s;
        }
        .btn-secondary:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); background: var(--bg-app); }
        .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
        :global(.dark) .btn-secondary { background: var(--bg-panel); border-color: var(--border-light); color: var(--text-heading); }

        .status-banner {
          padding: 1rem 1.5rem; border-radius: 14px; display: flex; align-items: center; gap: 12px;
          font-weight: 600; font-size: 0.95rem; margin-bottom: 0.5rem;
        }
        .status-banner.success { background: #ecfdf5; color: #059669; border: 1px solid #10b981; }
        .status-banner.error { background: #fef2f2; color: #dc2626; border: 1px solid #ef4444; }

        .vendedores-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }

        .table-controls { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; }
        
        .filter-tabs { display: flex; gap: 4px; padding: 4px; background: var(--bg-app); border-radius: 12px; }
        .filter-tab {
          padding: 6px 16px; border-radius: 8px; border: none; background: transparent;
          color: var(--text-muted); font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: all 0.2s;
        }
        .filter-tab.active { background: white; color: var(--primary); box-shadow: var(--shadow-sm); }
        .tab-short-text { display: none; }

        .table-card { padding: 0 !important; overflow: hidden; }
        .table-loading { padding: 4rem; display: flex; justify-content: center; }

        .elite-table { width: 100%; border-collapse: collapse; text-align: left; }
        .elite-table th {
          padding: 1.25rem 1.5rem; background: #fafbfc; font-size: 0.75rem; 
          font-weight: 800; color: var(--text-muted); text-transform: uppercase;
          letter-spacing: 0.05em; border-bottom: 1px solid var(--border-subtle);
        }
        :global(.dark) .elite-table th { background: rgba(255,255,255,0.02); }

        .elite-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-light); vertical-align: middle; }

        .client-cell { display: flex; align-items: center; gap: 14px; }
        .client-icon {
          width: 38px; height: 38px; border-radius: 10px; background: var(--primary-glow); color: var(--primary);
          display: flex; align-items: center; justify-content: center;
        }
        .client-info { display: flex; flex-direction: column; }
        .client-name { font-weight: 700; color: var(--text-heading); font-size: 0.95rem; line-height: 1.2; }
        .client-segment { font-size: 0.75rem; color: var(--text-muted); }

        .id-tag { font-family: 'Monaco', monospace; font-size: 0.85rem; color: var(--text-muted); }
        .geo-item, .phone-item { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-body); }

        .action-btn-elite {
          width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; 
          justify-content: center; border: 1px solid var(--border-subtle); background: white;
          color: var(--text-muted); cursor: pointer; transition: all 0.2s;
        }
        .action-btn-elite:hover { border-color: var(--primary); color: var(--primary); background: var(--bg-app); }

        .pagination { display: flex; align-items: center; justify-content: flex-end; gap: 1.5rem; padding: 1.25rem 1.5rem; background: #fafbfc; }
        :global(.dark) .pagination { background: rgba(255,255,255,0.01); }
        .pag-info { font-size: 0.85rem; color: var(--text-muted); font-weight: 600; }
        .pag-info span { color: var(--text-heading); font-weight: 800; }
        .pag-btn {
          width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--border-subtle);
          background: white; color: var(--text-muted); display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
        }
        .pag-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
        .pag-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        @media (max-width: 1024px) {
          .table-controls { flex-direction: column; gap: 1rem; align-items: stretch; }
          .hide-tablet { display: none; }
          .tab-full-text { display: none; }
          .tab-short-text { display: inline; }
        }

        @media (max-width: 640px) {
          .hide-mobile { display: none; }
          .btn-text { display: none; }
        }
      `}</style>
    </div>
  );
};

export default CarteraList;
