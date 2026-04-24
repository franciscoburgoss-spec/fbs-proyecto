import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProyectoActivoContext } from '../context/ProyectoActivoContext'
import ProjectSelector from './ProjectSelector'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '□' },
  { to: '/documents', label: 'Documents', icon: '▤' },
  { to: '/modules', label: 'Modules', icon: '▦' },
  { to: '/tasks', label: 'My Tasks', icon: '▣' },
  { to: '/users', label: 'Users & Roles', icon: '▧' },
  { to: '/settings', label: 'Settings', icon: '▨' },
]

function Breadcrumb() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280' }}>
      <span style={{ color: '#9ca3af' }}>Dashboard</span>
      <span style={{ color: '#d1d5db' }}>/</span>
      <span style={{ color: '#6b7280' }}>Projects</span>
      <span style={{ color: '#d1d5db' }}>/</span>
      <span style={{ color: '#374151', fontWeight: 500 }}>Engineering Designs</span>
    </div>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const { proyectoActivoId, cambiarProyecto } = useProyectoActivoContext()

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8f9fa', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          background: '#f8f9fa',
          borderRight: '1px solid #e5e7eb',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: 0.5 }}>FBS</h2>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af' }}>Document Control System</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => ({
                padding: '10px 14px',
                borderRadius: 8,
                textDecoration: 'none',
                color: isActive ? '#111827' : '#6b7280',
                background: isActive ? '#ffffff' : 'transparent',
                fontSize: 14,
                fontWeight: isActive ? 500 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                border: isActive ? '1px solid #e5e7eb' : '1px solid transparent',
                boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
                transition: 'all 0.12s',
              })}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: 'center', color: 'inherit' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer sidebar */}
        {user && (
          <div style={{ paddingTop: 16, borderTop: '1px solid #e5e7eb', marginTop: 'auto' }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
              <div style={{ fontWeight: 600, color: '#374151' }}>{user.username}</div>
              <div style={{ textTransform: 'uppercase', fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{user.rol}</div>
            </div>
            <button
              onClick={logout}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #e5e7eb',
                background: '#fff',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Cerrar sesion
            </button>
          </div>
        )}
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header
          style={{
            height: 56,
            background: '#fff',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            flexShrink: 0,
          }}
        >
          <div>
            <Breadcrumb />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <ProjectSelector value={proyectoActivoId} onChange={cambiarProyecto} />
            <button
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: '1px solid #111827',
                background: '#111827',
                color: '#fff',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Edit Project
            </button>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                }}
                title="Buscar"
              >
                🔍
              </button>
              <button
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                }}
                title="Notificaciones"
              >
                🔔
              </button>
              <button
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                }}
                title="Perfil"
              >
                👤
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
