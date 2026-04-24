import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/proyectos', label: 'Proyectos' },
  { to: '/documentos', label: 'Documentos' },
  { to: '/perfil', label: 'Mi Perfil' },
]

export default function Layout() {
  const { user, logout } = useAuth()

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <aside style={{ width: 200, borderRight: '1px solid #ddd', padding: 16, display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ margin: '0 0 16px' }}>FBS</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                padding: '8px 12px',
                borderRadius: 4,
                textDecoration: 'none',
                color: isActive ? '#fff' : '#333',
                background: isActive ? '#2563eb' : 'transparent',
              })}
            >
              {item.label}
            </NavLink>
          ))}
          {user?.rol === 'admin' && (
            <NavLink
              to="/admin"
              style={({ isActive }) => ({
                padding: '8px 12px',
                borderRadius: 4,
                textDecoration: 'none',
                color: isActive ? '#fff' : '#b45309',
                background: isActive ? '#2563eb' : '#fef3c7',
                fontWeight: 600,
              })}
            >
              Admin
            </NavLink>
          )}
          {user?.rol === 'admin' && (
            <NavLink
              to="/auditoria"
              style={({ isActive }) => ({
                padding: '8px 12px',
                borderRadius: 4,
                textDecoration: 'none',
                color: isActive ? '#fff' : '#374151',
                background: isActive ? '#2563eb' : '#f3f4f6',
                fontWeight: 600,
              })}
            >
              Auditoria
            </NavLink>
          )}
        </nav>

        {/* Footer del sidebar con usuario y logout */}
        {user && (
          <div style={{ borderTop: '1px solid #eee', paddingTop: 12, marginTop: 'auto' }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
              {user.username} ({user.rol})
            </div>
            <button
              onClick={logout}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: 4,
                background: '#fff',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Cerrar sesion
            </button>
          </div>
        )}
      </aside>
      <main style={{ flex: 1, padding: 24, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}