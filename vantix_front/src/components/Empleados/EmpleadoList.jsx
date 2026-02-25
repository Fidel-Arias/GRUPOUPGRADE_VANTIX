import React, { useState, useEffect } from 'react';
import { empleadoService } from '../../services/api';
import EmpleadoModal from './EmpleadoModal';
import PageHeader from '../Common/PageHeader';
import PremiumCard from '../Common/PremiumCard';
import Badge from '../Common/Badge';
import SearchInput from '../Common/SearchInput';
import LoadingSpinner from '../Common/LoadingSpinner';
import EmptyState from '../Common/EmptyState';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Mail,
  Download,
  ShieldAlert,
  Edit,
  UserCheck,
  UserPlus
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
    try {
      if (selectedEmpleado) {
        await empleadoService.update(selectedEmpleado.id_empleado, formData);
      } else {
        await empleadoService.create(formData);
      }
      setIsModalOpen(false);
      fetchEmpleados();
    } catch (error) {
      alert('Error al guardar: ' + error.message);
    }
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
      <PageHeader
        title="Gestión de Empleados"
        description="Administra el personal y sus credenciales de acceso."
        icon={Users}
        breadcrumb={['Apps', 'Empleados']}
        actions={
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
        }
      />

      <PremiumCard className="table-controls" hover={false}>
        <SearchInput
          placeholder="Buscar por nombre o DNI..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="filter-pill-group">
          {['todos', 'activos', 'inactivos'].map((filter) => (
            <button
              key={filter}
              className={`filter-pill ${filterActive === filter ? 'active' : ''}`}
              onClick={() => setFilterActive(filter)}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </PremiumCard>

      <PremiumCard className="table-card">
        {loading ? (
          <div className="loading-wrapper">
            <LoadingSpinner message="Consultando personal..." />
          </div>
        ) : (
          <table className="elite-table">
            <thead>
              <tr>
                <th>Empleado</th>
                <th className="hide-mobile">Identificación</th>
                <th className="hide-tablet">Contacto</th>
                <th className="hide-tablet">Cargo</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmpleados.length > 0 ? (
                filteredEmpleados.map((emp) => (
                  <tr key={emp.id_empleado}>
                    <td>
                      <div className="user-profile-cell">
                        <div className="avatar-mini">
                          {emp.nombre_completo?.charAt(0) || 'U'}
                        </div>
                        <div className="user-info">
                          <div className="name-admin">
                            <span className="user-name">{emp.nombre_completo}</span>
                            {emp.is_admin && (
                              <Badge variant="danger" icon={ShieldAlert}>Admin</Badge>
                            )}
                          </div>
                          <span className="user-id">ID: #{emp.id_empleado}</span>
                        </div>
                      </div>
                    </td>
                    <td className="hide-mobile"><span className="dni-tag">{emp.dni}</span></td>
                    <td className="hide-tablet">
                      <div className="contact-item">
                        <Mail size={14} />
                        <span>{emp.email_corporativo || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="hide-tablet">
                      <Badge variant="primary">{emp.cargo || 'Asesor'}</Badge>
                    </td>
                    <td>
                      <Badge variant={emp.activo ? 'success' : 'default'} icon={emp.activo ? CheckCircle : XCircle}>
                        {emp.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <div className="actions-menu">
                        <button className="action-icon-btn" title="Editar" onClick={() => handleEdit(emp)}>
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
                  <td colSpan="6">
                    <EmptyState
                      icon={Users}
                      title="Sin resultados"
                      message="No encontramos empleados con esos criterios."
                      actionLabel="Ver Todos"
                      onAction={() => { setFilterActive('todos'); setSearchTerm(''); }}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </PremiumCard>

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
          gap: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: var(--bg-sidebar);
          color: white;
          border: none;
        }

        .btn-secondary {
          background: white;
          border: 1px solid var(--border-subtle);
          color: var(--text-body);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .table-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
        }

        .filter-pill-group {
          display: flex;
          gap: 8px;
          padding: 4px;
          background: var(--bg-app);
          border-radius: 12px;
        }

        .filter-pill {
          padding: 6px 16px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-weight: 700;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-pill.active {
          background: white;
          color: var(--primary);
          box-shadow: var(--shadow-sm);
        }

        .table-card { padding: 0 !important; overflow: hidden; }

        .elite-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .elite-table th {
          padding: 1.25rem 1.5rem;
          background: #fafbfc;
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border-subtle);
        }
        :global(.dark) .elite-table th { background: rgba(255,255,255,0.02); }

        .elite-table td {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-light);
          vertical-align: middle;
        }

        .user-profile-cell { display: flex; align-items: center; gap: 14px; }
        .avatar-mini {
          width: 40px; height: 40px; border-radius: 12px; 
          background: var(--primary-glow); color: var(--primary);
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 1.1rem;
        }

        .name-admin { display: flex; align-items: center; gap: 8px; }
        .user-name { font-weight: 700; color: var(--text-heading); font-size: 0.95rem; }
        .user-id { font-size: 0.75rem; color: var(--text-muted); }

        .dni-tag { font-family: 'Monaco', monospace; font-size: 0.85rem; color: var(--text-muted); }
        .contact-item { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-body); }

        .actions-menu { display: flex; gap: 6px; justify-content: flex-end; }
        .action-icon-btn {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid var(--border-subtle); background: white;
          color: var(--text-muted); cursor: pointer; transition: all 0.2s;
        }
        .action-icon-btn:hover { border-color: var(--primary); color: var(--primary); }
        .action-icon-btn.danger:hover { border-color: #ef4444; color: #ef4444; background: #fff1f2; }

        .loading-wrapper { padding: 4rem; display: flex; justify-content: center; }

        @media (max-width: 1024px) {
          .table-controls { flex-direction: column; gap: 1rem; align-items: stretch; }
          .hide-tablet { display: none; }
        }

        @media (max-width: 640px) {
          .hide-mobile { display: none; }
          .btn-text { display: none; }
        }
      `}</style>
    </div>
  );
};

export default EmpleadoList;
