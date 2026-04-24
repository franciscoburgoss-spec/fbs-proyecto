import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProyectoActivoContext } from '../context/ProyectoActivoContext'
import ProjectSelector from './ProjectSelector'
import {
  Home,
  FileText,
  Folder,
  LayoutGrid,
  Users,
  Settings,
  Search,
  Bell,
  User,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/modules', label: 'Modules', icon: Folder },
  { to: '/tasks', label: 'My Tasks', icon: LayoutGrid },
  { to: '/users', label: 'Users & Roles', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function Breadcrumb() {
  return (
    <div className="flex items-center gap-2 text-[13px] text-[#9ca3af]">
      <span>Dashboard</span>
      <span className="text-[#d1d5db]">/</span>
      <span>Projects</span>
      <span className="text-[#d1d5db]">/</span>
      <span className="text-[#374151] font-medium">Engineering Designs</span>
    </div>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const { proyectoActivoId, cambiarProyecto } = useProyectoActivoContext()

  return (
    <div className="flex h-screen bg-[#f8f9fa] font-sans text-[#111827]">
      {/* Sidebar */}
      <aside className="w-[240px] bg-[#f8f9fa] border-r border-[#e5e7eb] flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-5 pt-6 pb-8">
          <h2 className="text-[20px] font-bold text-[#111827] tracking-[0.5px]">FBS</h2>
          <p className="text-[11px] text-[#9ca3af] mt-1">Document Control System</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                [
                  'w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-white text-[#1f2937] shadow-sm border border-[#e5e7eb]'
                    : 'text-[#6b7280] hover:text-[#374151] hover:bg-[#f0f1f3]',
                ].join(' ')
              }
            >
              <item.icon className="w-[18px] h-[18px] shrink-0 text-[#4b5563]" strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer sidebar */}
        {user && (
          <div className="px-3 pt-4 pb-5 border-t border-[#e5e7eb]">
            <div className="text-[12px] text-[#6b7280] mb-3 px-3">
              <div className="font-semibold text-[#374151]">{user.username}</div>
              <div className="uppercase text-[10px] text-[#9ca3af] mt-0.5">{user.rol}</div>
            </div>
            <button
              onClick={logout}
              className="w-full py-2 px-3 rounded-md border border-[#e5e7eb] bg-white text-[#6b7280] text-[13px] font-medium hover:bg-[#f9fafb] transition-colors"
            >
              Cerrar sesion
            </button>
          </div>
        )}
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white border-b border-[#e5e7eb] flex items-center justify-between px-6 shrink-0">
          <Breadcrumb />
          <div className="flex items-center gap-4">
            <ProjectSelector value={proyectoActivoId} onChange={cambiarProyecto} />
            <button className="px-3.5 py-1.5 rounded-md border border-[#111827] bg-[#111827] text-white text-[13px] font-medium hover:bg-[#374151] transition-colors">
              Edit Project
            </button>
            <div className="flex items-center gap-1.5">
              <button
                className="w-[34px] h-[34px] rounded-md border border-[#e5e7eb] bg-white flex items-center justify-center text-[#6b7280] hover:bg-[#f9fafb] transition-colors"
                title="Buscar"
              >
                <Search className="w-4 h-4" strokeWidth={2} />
              </button>
              <button
                className="w-[34px] h-[34px] rounded-md border border-[#e5e7eb] bg-white flex items-center justify-center text-[#6b7280] hover:bg-[#f9fafb] transition-colors relative"
                title="Notificaciones"
              >
                <Bell className="w-4 h-4" strokeWidth={2} />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
              </button>
              <button
                className="w-[34px] h-[34px] rounded-md border border-[#e5e7eb] bg-white flex items-center justify-center text-[#6b7280] hover:bg-[#f9fafb] transition-colors"
                title="Perfil"
              >
                <User className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
