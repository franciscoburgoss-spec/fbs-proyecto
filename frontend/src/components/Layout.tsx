import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import ProjectSelector from './ProjectSelector'
import { useProyectoActivo } from '../hooks/useProyectoActivo'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/documents', label: 'Documents', icon: '📄' },
  { to: '/modules', label: 'Modules', icon: '📦' },
  { to: '/tasks', label: 'My Tasks', icon: '✅' },
  { to: '/users', label: 'Users & Roles', icon: '👥' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

function Breadcrumb() {
  const location = useLocation()
  const parts = location.pathname.split('/').filter(Boolean)
  if (parts.length === 0) return <span style={{ color: '#6b7280', fontSize: 13 }}>Dashboard</span>

  const labels: Record<string, string> = {
    documents: 'Documents',
    modules: 'Modules',
    tasks: 'My Tasks',
    users: 'Users & Roles',
    settings: 'Settings',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280' }}>
      <span>Dashboard</span>
      <span>/</span>
      <span style={{ color: '#374151', fontWeight: 500 }}>
        {labels[parts[0]] || parts[0]}
      </span>
      {parts[1] && (
        <>
          <span>/</span>
          <span style={{ color: '#374151' }}>{parts[1]}</span>
        </>
      )}
    </div>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const { proyectoActivoId, cambiarProyecto } = useProyectoActivo()

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          background: '#1e293b',
          padding: '20px 0',
          display: 'flex',
          flexDirection: 'column',
          color: '#fff',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #334155' }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: 1 }}>FBS</h2>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>Document Control System</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '16px 12px', flex: 1 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                padding: '10px 12px',
                borderRadius: 6,
                textDecoration: 'none',
                color: isActive ? '#fff' : '#94a3b8',
                background: isActive ? '#334155' : 'transparent',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'all 0.15s',
              })}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer del sidebar */}
        {user && (
          <div style={{ padding: '16px 20px 0', borderTop: '1px solid #334155' }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
              <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{user.username}</div>
              <div style={{ textTransform: 'uppercase', fontSize: 10 }}>{user.rol}</div>
            </div>
            <button
              onClick={logout}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #475569',
                borderRadius: 6,
                background: 'transparent',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: 13,
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
            borderBottom: '1px solid #e2e8f0',
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
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
                title="Notificaciones"
              >
                🔔
              </button>
              <button
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
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
