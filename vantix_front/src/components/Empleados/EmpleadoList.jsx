import React, { useState, useEffect } from 'react';
import { empleadoService } from '../../services/api';
import EmpleadoModal from './EmpleadoModal';
import {
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Filter,
  Download
} from 'lucide-react';

const EmpleadoList = () => {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('todos'); // 'todos', 'activos', 'inactivos'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);

  useEffect(() => {
    fetchEmpleados();
  }, []);

  const fetchEmpleados = async () => {
    try {
      setLoading(true);
      const data = await empleadoService.getAll();
      setEmpleados(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmpleado = async (formData) => {
    if (selectedEmpleado) {
      // Actualizar
      await empleadoService.update(selectedEmpleado.id_empleado, formData);
    } else {
      // Crear
      await empleadoService.create(formData);
    }
    fetchEmpleados();
  };

  const handleEdit = (emp) => {
    setSelectedEmpleado(emp);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedEmpleado(null);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (id) => {
    try {
      await empleadoService.toggleActive(id);
      fetchEmpleados();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const filteredEmpleados = empleados.filter(emp => {
    const matchesSearch =
      emp.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.dni?.includes(searchTerm);

    if (filterActive === 'activos') return matchesSearch && emp.activo;
    if (filterActive === 'inactivos') return matchesSearch && !emp.activo;
    return matchesSearch;
  });

  return (
    <div className="empleados-container">
      <div className="section-header">
        <div className="title-group">
          <h2>Gestión de Empleados</h2>
          <p>Administra el personal y sus credenciales de acceso.</p>
        </div>
        <div className="action-group">
          <button className="btn-secondary">
            <Download size={18} />
            <span className="btn-text">Exportar</span>
          </button>
          <button className="btn-primary" onClick={handleAddNew}>
            <Plus size={18} />
            <span className="btn-text">Nuevo Empleado</span>
          </button>
        </div>
      </div>

      <div className="table-controls card-premium">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filterActive === 'todos' ? 'active' : ''}`}
              onClick={() => setFilterActive('todos')}
            >
              Todos
            </button>
            <button
              className={`filter-tab ${filterActive === 'activos' ? 'active' : ''}`}
              onClick={() => setFilterActive('activos')}
            >
              Activos
            </button>
            <button
              className={`filter-tab ${filterActive === 'inactivos' ? 'active' : ''}`}
              onClick={() => setFilterActive('inactivos')}
            >
              Inactivos
            </button>
          </div>
        </div>
      </div>

      <div className="table-wrapper card-premium">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando empleados...</p>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Empleado</th>
                <th className="hide-mobile">DNI / Identificación</th>
                <th className="hide-tablet">Contacto</th>
                <th className="hide-tablet">Cargo / Área</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmpleados.length > 0 ? (
                filteredEmpleados.map((emp) => (
                  <tr key={emp.id_empleado}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          {emp.nombre_completo?.charAt(0)}
                        </div>
                        <div className="user-text">
                          <span className="user-name">{emp.nombre_completo}</span>
                          <span className="user-id">ID: #{emp.id_empleado}</span>
                        </div>
                      </div>
                    </td>
                    <td className="hide-mobile"><span className="dni-tag">{emp.dni}</span></td>
                    <td className="hide-tablet">
                      <div className="contact-info">
                        <div className="contact-item">
                          <Mail size={14} />
                          <span>{emp.email_corporativo || 'N/A'}</span>
                        </div>
                        <div className="contact-item">
                          <Phone size={14} />
                          <span>{emp.telefono || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="hide-tablet">
                      <div className="role-tag">
                        {emp.cargo || 'Sin cargo'}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${emp.activo ? 'active' : 'inactive'}`}>
                        {emp.activo ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        <span className="status-text">{emp.activo ? 'Activo' : 'Inactivo'}</span>
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="actions-menu">
                        <button
                          className="action-icon-btn"
                          title="Editar"
                          onClick={() => handleEdit(emp)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className={`action-icon-btn ${emp.activo ? 'danger' : 'success'}`}
                          title={emp.activo ? 'Desactivar' : 'Activar'}
                          onClick={() => handleToggleActive(emp.id_empleado)}
                        >
                          {emp.activo ? <Trash2 size={16} /> : <CheckCircle size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">
                    <Users size={48} />
                    <p>No se encontraron empleados que coincidan con la búsqueda.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <EmpleadoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEmpleado}
        empleado={selectedEmpleado}
      />

      <style jsx>{`
        .empleados-container {
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
          gap: 12px;
        }

        .btn-primary, .btn-secondary {
          padding: 0.7rem 1.25rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: var(--transition);
        }

        .btn-primary {
          background: var(--bg-sidebar);
          color: white;
          border: none;
          box-shadow: var(--shadow-md);
        }

        .btn-primary:hover {
          background: #1e293b;
          transform: translateY(-2px);
        }

        .btn-secondary {
          background: var(--bg-panel);
          color: var(--text-heading);
          border: 1px solid var(--border-subtle);
          box-shadow: var(--shadow-sm);
        }

        .btn-secondary:hover {
          border-color: var(--primary);
          color: var(--primary);
          background: var(--bg-app);
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
          width: 350px;
          height: 42px;
          transition: var(--transition);
        }

        .search-box:focus-within {
          border-color: var(--primary);
          background: var(--bg-panel);
          box-shadow: 0 0 0 3px var(--primary-soft);
        }

        .search-icon {
          color: var(--text-muted);
          margin-right: 10px;
        }

        .search-box input {
          border: none;
          background: none;
          outline: none;
          width: 100%;
          font-size: 0.9rem;
          font-family: inherit;
          color: var(--text-heading);
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
          border-radius: 8px;
          border: none;
          background: none;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          transition: var(--transition);
        }

        .filter-tab.active {
          background: var(--bg-panel);
          color: var(--primary);
          box-shadow: var(--shadow-sm);
        }

        .table-wrapper {
          padding: 0;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .custom-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          min-width: 500px;
        }

        .custom-table th {
          background: var(--bg-app);
          padding: 1rem 1.5rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border-subtle);
          white-space: nowrap;
        }

        .custom-table td {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-light);
          vertical-align: middle;
          color: var(--text-body);
        }

        .custom-table tr:hover td {
          background: var(--bg-app);
          opacity: 0.8;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 200px;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          background: var(--primary-soft);
          color: var(--primary);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
          flex-shrink: 0;
        }

        .user-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .user-name {
          font-weight: 700;
          color: var(--text-heading);
          font-size: 0.95rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-id {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .dni-tag {
          font-family: monospace;
          background: var(--bg-app);
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-heading);
          white-space: nowrap;
          border: 1px solid var(--border-subtle);
        }

        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: var(--text-body);
          white-space: nowrap;
        }

        .contact-item svg {
          color: var(--text-muted);
        }

        .role-tag {
          display: inline-block;
          padding: 4px 10px;
          background: var(--primary-soft);
          color: var(--primary);
          border-radius: 30px;
          font-size: 0.75rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 30px;
          font-size: 0.75rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .status-badge.active {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .status-badge.inactive {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .text-right { text-align: right; }

        .actions-menu {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

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
          transition: var(--transition);
          flex-shrink: 0;
        }

        .action-icon-btn:hover {
          color: var(--primary);
          border-color: var(--primary);
          background: var(--bg-app);
        }

        .action-icon-btn.danger:hover {
          color: #ef4444;
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        .action-icon-btn.success:hover {
          color: #22c55e;
          border-color: #22c55e;
          background: rgba(34, 197, 94, 0.1);
        }

        .loading-state, .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          gap: 1rem;
          color: var(--text-muted);
        }

        .spinner {
          width: 30px;
          height: 30px;
          border: 3px solid var(--primary-soft);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

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
        }

        @media (max-width: 640px) {
          .title-group h2 {
            font-size: 1.5rem;
          }
          .btn-text {
            display: none;
          }
          .btn-primary, .btn-secondary {
            padding: 0.7rem;
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
          }
          .btn-primary {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            box-shadow: 0 10px 25px rgba(15, 23, 42, 0.4);
          }
          .btn-secondary {
            display: none; /* Hide export on tiny mobile or move it */
          }
          .hide-mobile {
            display: none;
          }
          .status-text {
            display: none;
          }
          .status-badge {
            padding: 4px;
            width: 24px;
            height: 24px;
            justify-content: center;
          }
          .custom-table td, .custom-table th {
            padding: 1rem 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default EmpleadoList;
