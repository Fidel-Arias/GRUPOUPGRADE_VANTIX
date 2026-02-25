import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CalendarCheck,
  MapPin,
  TrendingUp,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  PhoneCall,
  Menu,
  X,
  Zap,
  ShieldCheck,
  DollarSign,
  Sun,
  Moon
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Empleados', path: '/empleados' },
  { icon: Briefcase, label: 'Cartera Clientes', path: '/cartera' },
  { icon: CalendarCheck, label: 'Planes Semanales', path: '/planes' },
  { icon: MapPin, label: 'Registro Visitas', path: '/visitas' },
  { icon: PhoneCall, label: 'CRM / Llamadas', path: '/crm' },
  { icon: TrendingUp, label: 'Rendimiento (KPI)', path: '/kpi' },
  { icon: DollarSign, label: 'Gastos de Movilidad', path: '/finanzas' },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
    document.documentElement.style.transition = 'background-color 0.3s ease, color 0.3s ease';
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Determinamos el item activo basado en la URL
  const [activeItem, setActiveItem] = useState('Dashboard');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
      const active = menuItems.find(item => item.path === currentPath)?.label || 'Dashboard';
      setActiveItem(active);

      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);

      if (window.innerWidth > 1024 && window.innerWidth < 1440) {
        setIsCollapsed(true);
      }

      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Sincronizar con el layout global
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-sidebar-collapsed', isCollapsed.toString());
    }
  }, [isCollapsed]);

  const sidebarVariants = {
    expanded: { width: 280 },
    collapsed: { width: 88, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    mobileOpen: { x: 0, width: 280 },
    mobileClosed: { x: '-100%', width: 280 }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sidebar-overlay"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={windowWidth < 1024 ? (isOpen ? 'mobileOpen' : 'mobileClosed') : (isCollapsed ? 'collapsed' : 'expanded')}
        variants={sidebarVariants}
        className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
      >
        {windowWidth > 1024 && (
          <button className="collapse-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}

        <div className="sidebar-header">
          <motion.div className="brand" layout>
            <motion.div className="logo-square" layoutId="logo">
              <Zap size={20} fill="currentColor" />
            </motion.div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="brand-info"
                >
                  <span className="brand-name">VANTIX</span>
                  <span className="brand-tag">Elite Edition</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <button className="mobile-close" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group">
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="group-label"
                >
                  PRINCIPAL
                </motion.p>
              )}
            </AnimatePresence>

            <ul>
              {menuItems.map((item, index) => (
                <motion.li
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <a
                    href={item.path}
                    className={`nav-item ${activeItem === item.label ? 'active' : ''}`}
                    title={isCollapsed ? item.label : ''}
                  >
                    <div className="icon-wrapper">
                      <item.icon size={20} strokeWidth={activeItem === item.label ? 2.5 : 2} />
                    </div>
                    {!isCollapsed && <span className="item-label">{item.label}</span>}

                    {activeItem === item.label && (
                      <motion.div
                        layoutId="active-pill"
                        className="active-pill"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="nav-group" style={{ marginTop: 'auto' }}>
            <ul>
              <motion.li layout>
                <div onClick={toggleTheme} className="nav-item theme-item" style={{ cursor: 'pointer' }}>
                  <div className="icon-wrapper">
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                  </div>
                  {!isCollapsed && <span className="item-label">{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>}
                </div>
              </motion.li>
              <motion.li layout>
                <a href="/settings" className="nav-item">
                  <div className="icon-wrapper"><Settings size={20} /></div>
                  {!isCollapsed && <span className="item-label">Configuración</span>}
                </a>
              </motion.li>
            </ul>
          </div>
        </nav>

        <div className="sidebar-footer">
          <motion.div className="user-card-elite" layout>
            <div className="avatar-wrap">
              <UserCircle size={isCollapsed ? 32 : 42} strokeWidth={1} />
              <div className="status-indicator"></div>
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="user-details"
              >
                <p className="user-name">Yoshiro Milton</p>
                <div className="badge-pro">
                  <ShieldCheck size={10} />
                  <span>Admin Pro</span>
                </div>
              </motion.div>
            )}
            {!isCollapsed && (
              <button className="logout-btn" title="Salir">
                <LogOut size={16} />
              </button>
            )}
          </motion.div>
        </div>
      </motion.aside>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="mobile-trigger"
        onClick={() => setIsOpen(true)}
      >
        <Menu size={22} />
      </motion.button>

      <style jsx>{`
        .sidebar {
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          display: flex;
          flex-direction: column;
          z-index: 1000;
          background: var(--bg-sidebar);
          color: white;
          padding: 1.5rem 1rem;
          box-shadow: 10px 0 50px rgba(0,0,0,0.2);
          overflow: visible;
          transition: padding 0.3s ease;
        }

        .sidebar.collapsed {
          padding: 1.5rem 0.5rem;
        }

        .sidebar-header {
          padding: 0.5rem 0.5rem 3rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          overflow: visible;
        }

        .logo-square {
          min-width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 16px rgba(14, 165, 233, 0.3);
        }

        .brand-info {
          display: flex;
          flex-direction: column;
          white-space: nowrap;
        }

        .brand-name {
          font-size: 1.1rem;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .brand-tag {
          font-size: 0.6rem;
          color: #64748b;
          font-weight: 800;
          text-transform: uppercase;
        }

        .collapse-toggle {
          position: absolute;
          right: -14px;
          top: 54px;
          transform: translateY(-50%);
          width: 28px;
          height: 28px;
          background: #1e293b;
          border: 2px solid #334155;
          border-radius: 50%;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1000;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }

        .collapse-toggle:hover {
          background: #0ea5e9;
          color: white;
          border-color: #0ea5e9;
          transform: translateY(-50%) scale(1.15);
          box-shadow: 0 0 20px rgba(14, 165, 233, 0.5);
          right: -16px;
        }

        .mobile-close {
          display: none;
          background: rgba(255,255,255,0.05);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
        }

        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .group-label {
          font-size: 0.65rem;
          font-weight: 800;
          color: #475569;
          letter-spacing: 2px;
          margin-bottom: 1.25rem;
          padding-left: 1rem;
        }

        ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .nav-item {
          display: flex;
          align-items: center;
          padding: 0.85rem 1rem;
          border-radius: 16px;
          gap: 16px;
          margin-bottom: 0.5rem;
          color: #94a3b8;
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
        }

        .nav-item:hover {
          background: rgba(255,255,255,0.03);
          color: white;
        }

        .nav-item.active {
          color: #0ea5e9;
          background: rgba(14, 165, 233, 0.08);
        }

        .icon-wrapper {
          min-width: 24px;
          display: flex;
          justify-content: center;
        }

        .item-label {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .active-pill {
          position: absolute;
          left: 0;
          width: 3px;
          height: 24px;
          background: #0ea5e9;
          border-radius: 0 4px 4px 0;
          box-shadow: 0 0 15px #0ea5e9;
        }

        .sidebar-footer {
          margin-top: auto;
          padding-top: 2rem;
        }

        .user-card-elite {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.03);
          padding: 0.75rem;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.05);
        }

        .avatar-wrap {
          position: relative;
          color: #0ea5e9;
        }

        .status-indicator {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 10px;
          height: 10px;
          background: #22c55e;
          border: 2px solid #0b1120;
          border-radius: 50%;
        }

        .user-details {
          flex: 1;
          min-width: 0;
        }

        .user-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .badge-pro {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(14, 165, 233, 0.15);
          color: #0ea5e9;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.6rem;
          font-weight: 800;
          margin-top: 2px;
        }

        .logout-btn {
          background: rgba(239, 68, 68, 0.1);
          border: none;
          color: #ef4444;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .logout-btn:hover {
          background: #ef4444;
          color: white;
        }

        .sidebar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          z-index: 999;
        }

        .mobile-trigger {
          display: none;
          position: fixed;
          top: 1rem;
          left: 1rem;
          width: 44px;
          height: 44px;
          background: var(--bg-panel);
          border: 1px solid var(--border-subtle);
          color: var(--text-heading);
          border-radius: 12px;
          align-items: center;
          justify-content: center;
          z-index: 1001;
          box-shadow: var(--shadow-md);
        }

        @media (max-width: 1024px) {
          .mobile-trigger { display: flex; }
          .mobile-close { display: flex; align-items: center; justify-content: center; }
          .collapse-toggle { display: none; }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
