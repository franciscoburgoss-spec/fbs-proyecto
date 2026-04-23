import { Outlet, NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/proyectos', label: 'Proyectos' },
  { to: '/documentos', label: 'Documentos' },
]

export default function Layout() {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <aside style={{ width: 200, borderRight: '1px solid #ddd', padding: 16 }}>
        <h2 style={{ margin: '0 0 16px' }}>FBS</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
        </nav>
      </aside>
      <main style={{ flex: 1, padding: 24, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
