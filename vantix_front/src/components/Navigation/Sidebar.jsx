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
  UserCircle,
  PhoneCall,
  Menu,
  X,
  Zap,
  DollarSign,
  Sun,
  Moon
} from 'lucide-react';
import { authService } from '../../services/api';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.1)' },
  { icon: Users, label: 'Empleados', path: '/empleados', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  { icon: Briefcase, label: 'Cartera Clientes', path: '/cartera', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  { icon: CalendarCheck, label: 'Planes Semanales', path: '/planes', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
  { icon: MapPin, label: 'Registro Visitas', path: '/visitas', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
  { icon: PhoneCall, label: 'CRM / Llamadas', path: '/crm', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
  { icon: TrendingUp, label: 'Rendimiento (KPI)', path: '/kpi', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
  { icon: DollarSign, label: 'Gastos de Movilidad', path: '/finanzas', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [user, setUser] = useState(null);
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    // Sync theme and user
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
    setUser(authService.getUser());

    // Sync path and listen for changes
    const updatePath = () => {
      const path = window.location.pathname.replace(/\/$/, '') || '/';
      setCurrentPath(path);
    };

    updatePath();
    window.addEventListener('popstate', updatePath);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('popstate', updatePath);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Determine active item - logic must be client-side aware
  const getActiveLabel = () => {
    if (!currentPath) return '';

    // Sort items by path length descending to match most specific route first
    const sortedItems = [...menuItems].sort((a, b) => b.path.length - a.path.length);
    const active = sortedItems.find(item => {
      if (item.path === '/') return currentPath === '/';
      return currentPath.startsWith(item.path);
    });

    return active ? active.label : 'Dashboard';
  };

  const activeLabel = getActiveLabel();

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

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  const sidebarVariants = {
    expanded: { width: 280, x: 20, y: 20, height: 'calc(100vh - 40px)', transition: { type: 'spring', stiffness: 300, damping: 30 } },
    mobileOpen: { x: 0, width: 280, y: 0, height: '100vh', borderRadius: 0 },
    mobileClosed: { x: '-100%', width: 280, y: 0, height: '100vh' }
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
        animate={windowWidth < 1024 ? (isOpen ? 'mobileOpen' : 'mobileClosed') : 'expanded'}
        variants={sidebarVariants}
        className="sidebar"
      >
        <div className="sidebar-inner">
          <header className="sidebar-header">
            <div className="brand">
              <div className="logo-box">
                <Zap size={22} fill="white" strokeWidth={0} />
              </div>
              <div className="brand-text">
                <span className="name">VANTIX</span>
                <span className="edition">ELITE EDITION</span>
              </div>
            </div>

            {windowWidth < 1024 && (
              <button className="mobile-close" onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            )}
          </header>

          <nav className="sidebar-nav">
            <div className="nav-group main">
              <span className="group-label">APPS</span>
              <ul>
                {menuItems
                  .filter(item => {
                    // Solo administradores ven Empleados
                    if (item.label === 'Empleados' && !user?.is_admin) return false;

                    // El asesor no ve la pestaña de KPI (Rendimiento)
                    if (item.label === 'Rendimiento (KPI)' && !user?.is_admin) return false;

                    // Habilitamos Cartera para todos (el componente CarteraList maneja el filtrado interno)
                    if (item.label === 'Cartera Clientes') return true;

                    return true;
                  })
                  .map((item) => (
                    <li key={item.label}>
                      <a
                        href={item.path}
                        className={`nav-link ${activeLabel === item.label ? 'active' : ''}`}
                      >
                        <div className="icon-wrapper" style={{ backgroundColor: item.bg, color: item.color }}>
                          <item.icon size={20} strokeWidth={2.5} />
                        </div>
                        <span className="label">{item.label}</span>
                      </a>
                    </li>
                  ))}
              </ul>
            </div>

            <div className="nav-group bottom">
              <span className="group-label">DISPLAY</span>
              <ul>
                <li>
                  <button onClick={toggleTheme} className="nav-link">
                    <div className="icon-wrapper" style={{ background: '#f8fafc', color: '#64748b' }}>
                      {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </div>
                    <span className="label">{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
                  </button>
                </li>
              </ul>
            </div>
          </nav>

          <footer className="sidebar-footer">
            <div className="user-pill">
              <div className="user-avatar-box">
                <UserCircle size={36} strokeWidth={1.5} />
                <div className="online-status"></div>
              </div>

              <div className="user-meta">
                <span className="user-nickname">{user?.nombre_completo?.split(' ')[0] || 'Admin'}</span>
                <span className="user-role-label">{user?.cargo || 'Staff'}</span>
              </div>

              <button className="exit-button" onClick={handleLogout} title="Cerrar Sesión">
                <LogOut size={16} />
              </button>
            </div>
          </footer>
        </div>
      </motion.aside>

      <button className="mobile-trigger" onClick={() => setIsOpen(true)}>
        <Menu size={24} />
      </button>

      <style jsx>{`
        .sidebar {
          position: fixed;
          background: white;
          color: #1e293b;
          z-index: 1000;
          box-shadow: 0 10px 40px rgba(0,0,0,0.06);
          border: 1px solid rgba(0,0,0,0.05);
          border-radius: 32px;
          overflow: visible;
        }

        :global(.dark) .sidebar {
          background: #1e293b;
          color: white;
          border-color: rgba(255,255,255,0.05);
          box-shadow: 0 10px 40px rgba(0,0,0,0.4);
        }

        .sidebar-inner {
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 2.5rem 1.25rem;
          position: relative;
        }

        .sidebar-header {
          margin-bottom: 3rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-left: 0.5rem;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .logo-box {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #0ea5e9, #2563eb);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 16px rgba(14, 165, 233, 0.4);
        }

        .brand-text { line-height: 1.1; }
        .brand-text .name {
          font-size: 1.3rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.01em;
        }
        :global(.dark) .brand-text .name { color: white; }

        .brand-text .edition {
          font-size: 0.65rem;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.08em;
          display: block;
          margin-top: 2px;
        }

        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3rem;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .sidebar-nav::-webkit-scrollbar { width: 0; }

        .group-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 800;
          color: #cbd5e1;
          letter-spacing: 0.1em;
          margin-bottom: 1.25rem;
          padding-left: 0.75rem;
        }

        ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 0.8rem;
          color: #64748b;
          text-decoration: none;
          border-radius: 20px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          background: transparent;
          border: none;
          width: 100%;
          cursor: pointer;
        }
        :global(.dark) .nav-link { color: #94a3b8; }

        .nav-link:hover {
          background: #f8fafc;
          color: #0f172a;
          transform: translateX(4px);
        }
        :global(.dark) .nav-link:hover { background: rgba(255,255,255,0.03); color: white; }

        .nav-link.active {
          background: #f1f5f9;
          color: #0f172a;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.02);
        }
        :global(.dark) .nav-link.active { background: rgba(255,255,255,0.08); color: white; }

        .icon-wrapper {
          width: 44px;
          height: 44px;
          min-width: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
          background: white;
          transition: all 0.3s;
        }
        .nav-link:hover .icon-wrapper { transform: scale(1.05); }

        .label {
          font-size: 1rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .sidebar-footer { padding-top: 1.5rem; border-top: 1px solid #f8fafc; }
        :global(.dark) .sidebar-footer { border-color: rgba(255,255,255,0.03); }

        .user-pill {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0.5rem;
          border-radius: 18px;
        }

        .user-avatar-box { position: relative; color: #0ea5e9; }
        .online-status {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 10px;
          height: 10px;
          background: #22c55e;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        :global(.dark) .online-status { border-color: #1e293b; }

        .user-meta { flex: 1; min-width: 0; }
        .user-nickname {
          font-size: 0.95rem;
          font-weight: 700;
          color: #1e293b;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        :global(.dark) .user-nickname { color: white; }

        .user-role-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #94a3b8;
          display: block;
        }

        .exit-button {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: #fff1f2;
          color: #be123c;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        :global(.dark) .exit-button { background: rgba(225, 29, 72, 0.1); color: #fb7185; }
        .exit-button:hover { background: #be123c; color: white; }

        .sidebar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(8px);
          z-index: 998;
        }

        .mobile-trigger {
          display: none;
          position: fixed;
          top: 1.5rem;
          left: 1.5rem;
          width: 52px;
          height: 52px;
          background: white;
          border: 1px solid #f1f5f9;
          color: #1e293b;
          border-radius: 16px;
          align-items: center;
          justify-content: center;
          z-index: 900;
          box-shadow: 0 10px 20px rgba(0,0,0,0.05);
        }
        :global(.dark) .mobile-trigger { background: #1e293b; border-color: #334155; color: white; }

        @media (max-width: 1024px) {
          .mobile-trigger { display: flex; }
          .sidebar { border-radius: 0; border: none; }
          .mobile-close { display: flex; background: none; border: none; color: #64748b; cursor: pointer; }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
