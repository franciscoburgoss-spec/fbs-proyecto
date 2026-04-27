import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAdmin } from '../hooks/useAdmin'
import { register } from '../api'
import type { Usuario, RegisterIn } from '../types'
import {
  Users,
  UserPlus,
  Search,
  Shield,
  ShieldCheck,
  User,
  UserCheck,
  UserX,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  Filter,
} from 'lucide-react'

/* ─── Helpers ─── */

const getRoleBadge = (rol: string) => {
  if (rol === 'admin')
    return 'bg-[#dbeafe] text-[#1e40af] border border-[#bfdbfe]'
  return 'bg-[#f3f4f6] text-[#374151] border border-[#e5e7eb]'
}

const getStatusBadge = (activo: boolean) => {
  if (activo)
    return 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]'
  return 'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]'
}

const fmtDate = (ts: string) => {
  try {
    return new Date(ts).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ts
  }
}

/* ─── Sub-componentes ─── */

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmText: string
  confirmVariant?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmModal({
  open,
  title,
  message,
  confirmText,
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[420px]">
        <h3 className="text-base font-semibold text-[#111827] mb-2">{title}</h3>
        <p className="text-[13px] text-[#6b7280] mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md border border-[#e5e7eb] text-[13px] text-[#374151] hover:bg-[#f9fafb] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md text-[13px] text-white transition-colors ${
              confirmVariant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#111827] hover:bg-[#374151]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

interface NuevoUsuarioModalProps {
  open: boolean
  onClose: () => void
  onCreate: (data: RegisterIn) => Promise<void>
}

function NuevoUsuarioModal({ open, onClose, onCreate }: NuevoUsuarioModalProps) {
  const [form, setForm] = useState<RegisterIn>({
    username: '',
    email: '',
    password: '',
    rol: 'user',
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm({ username: '', email: '', password: '', rol: 'user' })
      setFormError(null)
      setSaving(false)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.username.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError('All fields are required')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      await onCreate(form)
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Error creating user')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[440px]">
        <h3 className="text-base font-semibold text-[#111827] mb-1">Add New User</h3>
        <p className="text-[13px] text-[#6b7280] mb-4">
          Create a new user account and assign a role.
        </p>

        {formError && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-md bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-[13px]">
            <AlertCircle size={14} />
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[12px] font-medium text-[#374151] mb-1">
              Username
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              className="w-full px-3 py-2 rounded-md border border-[#e5e7eb] bg-white text-[13px] text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#d1d5db]"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#374151] mb-1">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2 rounded-md border border-[#e5e7eb] bg-white text-[13px] text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#d1d5db]"
              placeholder="Enter email"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#374151] mb-1">
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full px-3 py-2 rounded-md border border-[#e5e7eb] bg-white text-[13px] text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#d1d5db]"
              placeholder="Enter password"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#374151] mb-1">
              Role
            </label>
            <div className="relative">
              <select
                value={form.rol}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rol: e.target.value as 'admin' | 'user' }))
                }
                className="w-full appearance-none pr-8 pl-3 py-2 rounded-md border border-[#e5e7eb] bg-white text-[13px] text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#d1d5db]"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-[#e5e7eb] text-[13px] text-[#374151] hover:bg-[#f9fafb] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-md text-[13px] text-white bg-[#111827] hover:bg-[#374151] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Página principal ─── */

export default function UsersRolesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const {
    usuarios,
    loading,
    error,
    cargar,
    cambiarRolUsuario,
    toggleUsuarioActivo,
  } = useAdmin()

  /* Filtros */
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState<'all' | 'admin' | 'user'>('all')
  const [filtroEstado, setFiltroEstado] = useState<'all' | 'active' | 'inactive'>('all')

  /* UI */
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    title: string
    message: string
    confirmText: string
    confirmVariant: 'danger' | 'primary'
    onConfirm: () => void
  } | null>(null)
  const [showNuevoModal, setShowNuevoModal] = useState(false)

  /* Proteger ruta */
  useEffect(() => {
    if (user && user.rol !== 'admin') {
      navigate('/')
    }
  }, [user, navigate])

  /* Cargar datos al montar */
  useEffect(() => {
    if (user?.rol === 'admin') {
      cargar()
    }
  }, [user, cargar])

  /* Auto-clear toast */
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  /* Filtrar */
  const filtrados = usuarios.filter((u) => {
    const matchBusqueda =
      u.username.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email.toLowerCase().includes(busqueda.toLowerCase())
    const matchRol = filtroRol === 'all' || u.rol === filtroRol
    const matchEstado =
      filtroEstado === 'all' ||
      (filtroEstado === 'active' && u.activo) ||
      (filtroEstado === 'inactive' && !u.activo)
    return matchBusqueda && matchRol && matchEstado
  })

  /* KPIs */
  const total = usuarios.length
  const admins = usuarios.filter((u) => u.rol === 'admin').length
  const activos = usuarios.filter((u) => u.activo).length
  const inactivos = usuarios.filter((u) => !u.activo).length

  /* Handlers */
  const handleClearFilters = () => {
    setBusqueda('')
    setFiltroRol('all')
    setFiltroEstado('all')
  }

  const handleRefresh = () => {
    cargar()
    setToast({ msg: 'Users refreshed', type: 'success' })
  }

  const openConfirm = (props: {
    title: string
    message: string
    confirmText: string
    confirmVariant?: 'danger' | 'primary'
    onConfirm: () => void
  }) => {
    setConfirmModal({
      open: true,
      confirmVariant: props.confirmVariant ?? 'primary',
      ...props,
    })
  }

  const closeConfirm = () => setConfirmModal(null)

  const handleToggleRole = (u: Usuario) => {
    const nuevoRol = u.rol === 'admin' ? 'user' : 'admin'
    openConfirm({
      title: `Change role for ${u.username}`,
      message: `Are you sure you want to change ${u.username} from ${u.rol} to ${nuevoRol}?`,
      confirmText: 'Change Role',
      onConfirm: async () => {
        try {
          await cambiarRolUsuario(u.id, nuevoRol)
          setToast({ msg: `Role updated for ${u.username}`, type: 'success' })
        } catch {
          setToast({ msg: 'Error updating role', type: 'error' })
        }
        closeConfirm()
      },
    })
  }

  const handleToggleStatus = (u: Usuario) => {
    const accion = u.activo ? 'deactivate' : 'activate'
    openConfirm({
      title: `${accion.charAt(0).toUpperCase() + accion.slice(1)} ${u.username}`,
      message: `Are you sure you want to ${accion} ${u.username}?`,
      confirmText: u.activo ? 'Deactivate' : 'Activate',
      confirmVariant: u.activo ? 'danger' : 'primary',
      onConfirm: async () => {
        try {
          await toggleUsuarioActivo(u.id)
          setToast({
            msg: `${u.username} ${u.activo ? 'deactivated' : 'activated'}`,
            type: 'success',
          })
        } catch (e: any) {
          const detail = e.response?.data?.detail || 'Error changing status'
          setToast({ msg: detail, type: 'error' })
        }
        closeConfirm()
      },
    })
  }

  const handleCrearUsuario = async (data: RegisterIn) => {
    await register(data)
    setToast({ msg: `User ${data.username} created`, type: 'success' })
    cargar()
    setShowNuevoModal(false)
  }

  if (!user || user.rol !== 'admin') return null

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-md text-[13px] shadow-sm border ${
            toast.type === 'success'
              ? 'bg-[#ecfdf5] border-[#a7f3d0] text-[#065f46]'
              : 'bg-[#fef2f2] border-[#fecaca] text-[#991b1b]'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Users size={18} className="text-[#6b7280]" />
            <h1 className="text-lg font-semibold text-[#111827]">Users & Roles</h1>
          </div>
          <p className="text-[13px] text-[#9ca3af] mt-1">
            Manage system users and their permissions
          </p>
        </div>
        <button
          onClick={() => setShowNuevoModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#111827] text-white text-[13px] hover:bg-[#374151] transition-colors"
        >
          <UserPlus size={14} />
          Add User
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-md bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-[13px]">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="border border-[#e5e7eb] rounded-lg bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-[#6b7280]" />
            <span className="text-[12px] text-[#6b7280]">Total Users</span>
          </div>
          <div className="text-2xl font-bold text-[#111827]">{total}</div>
        </div>

        <div className="border border-[#e5e7eb] rounded-lg bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={14} className="text-[#6b7280]" />
            <span className="text-[12px] text-[#6b7280]">Admins</span>
          </div>
          <div className="text-2xl font-bold text-[#111827]">{admins}</div>
        </div>

        <div className="border border-[#e5e7eb] rounded-lg bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck size={14} className="text-[#6b7280]" />
            <span className="text-[12px] text-[#6b7280]">Active Users</span>
          </div>
          <div className="text-2xl font-bold text-[#111827]">{activos}</div>
        </div>

        <div className="border border-[#e5e7eb] rounded-lg bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserX size={14} className="text-[#6b7280]" />
            <span className="text-[12px] text-[#6b7280]">Inactive Users</span>
          </div>
          <div className="text-2xl font-bold text-[#111827]">{inactivos}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1 text-[13px] text-[#6b7280]">
          <Filter size={14} />
          <span>Filters</span>
        </div>

        {/* Busqueda */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search username or email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-8 pr-3 py-2 rounded-md border border-[#e5e7eb] bg-white text-[13px] text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#d1d5db] w-[240px]"
          />
        </div>

        {/* Rol */}
        <div className="relative">
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value as any)}
            className="appearance-none pr-8 pl-3 py-2 rounded-md border border-[#e5e7eb] bg-white text-[13px] text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#d1d5db]"
          >
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none"
          />
        </div>

        {/* Estado */}
        <div className="relative">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as any)}
            className="appearance-none pr-8 pl-3 py-2 rounded-md border border-[#e5e7eb] bg-white text-[13px] text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#d1d5db]"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none"
          />
        </div>

        <button
          onClick={handleClearFilters}
          className="px-4 py-2 rounded-md border border-[#e5e7eb] bg-white text-[13px] text-[#374151] hover:bg-[#f9fafb] transition-colors"
        >
          Clear filters
        </button>

        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-[#e5e7eb] bg-white text-[13px] text-[#374151] hover:bg-[#f9fafb] transition-colors ml-auto"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-[13px] text-[#9ca3af]">
          <RefreshCw size={16} className="animate-spin mr-2" />
          Loading users...
        </div>
      )}

      {/* Tabla */}
      {!loading && (
        <div className="border border-[#e5e7eb] rounded-lg bg-white overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-[#374151] text-[12px] uppercase tracking-wide w-[60px]">
                  ID
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[#374151] text-[12px] uppercase tracking-wide">
                  Username
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[#374151] text-[12px] uppercase tracking-wide">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[#374151] text-[12px] uppercase tracking-wide w-[100px]">
                  Role
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[#374151] text-[12px] uppercase tracking-wide w-[100px]">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[#374151] text-[12px] uppercase tracking-wide w-[160px]">
                  Created
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[#374151] text-[12px] uppercase tracking-wide w-[180px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#9ca3af]">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={24} className="text-[#d1d5db]" />
                      <span>No users found</span>
                      <span className="text-[12px]">
                        Try adjusting your filters or refresh the page
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtrados.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-[#f3f4f6] hover:bg-[#f9fafb] transition-colors"
                  >
                    <td className="px-4 py-3 text-[#6b7280] font-mono text-[12px]">
                      #{u.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-[#111827] font-medium">
                        <User size={13} className="text-[#9ca3af] shrink-0" />
                        {u.username}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#6b7280]">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium capitalize ${getRoleBadge(
                          u.rol
                        )}`}
                      >
                        {u.rol === 'admin' ? (
                          <ShieldCheck size={11} />
                        ) : (
                          <User size={11} />
                        )}
                        {u.rol}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${getStatusBadge(
                          u.activo
                        )}`}
                      >
                        {u.activo ? (
                          <CheckCircle size={11} />
                        ) : (
                          <XCircle size={11} />
                        )}
                        {u.activo ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#374151]">{fmtDate(u.fecha_creacion)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleRole(u)}
                          className="px-2.5 py-1 rounded-md border border-[#e5e7eb] bg-white text-[11px] text-[#374151] hover:bg-[#f9fafb] transition-colors"
                          title="Toggle role"
                        >
                          Toggle Role
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2.5 py-1 rounded-md border text-[11px] transition-colors ${
                            u.activo
                              ? 'border-[#fecaca] bg-[#fef2f2] text-[#991b1b] hover:bg-[#fee2e2]'
                              : 'border-[#a7f3d0] bg-[#ecfdf5] text-[#065f46] hover:bg-[#d1fae5]'
                          }`}
                          title={u.activo ? 'Deactivate user' : 'Activate user'}
                        >
                          {u.activo ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer info */}
      {!loading && filtrados.length > 0 && (
        <div className="mt-4 text-[12px] text-[#9ca3af] flex items-center justify-between">
          <span>
            Showing {filtrados.length} of {usuarios.length} users
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck size={12} />
            Admin-only page
          </span>
        </div>
      )}

      {/* Modales */}
      <ConfirmModal
        open={confirmModal?.open ?? false}
        title={confirmModal?.title ?? ''}
        message={confirmModal?.message ?? ''}
        confirmText={confirmModal?.confirmText ?? ''}
        confirmVariant={confirmModal?.confirmVariant}
        onConfirm={confirmModal?.onConfirm ?? (() => {})}
        onCancel={closeConfirm}
      />

      <NuevoUsuarioModal
        open={showNuevoModal}
        onClose={() => setShowNuevoModal(false)}
        onCreate={handleCrearUsuario}
      />
    </div>
  )
}
