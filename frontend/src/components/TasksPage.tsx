import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAuditoria } from '../hooks/useAuditoria'
import {
  LayoutGrid,
  Activity,
  Calendar,
  Filter,
  RefreshCw,
  AlertCircle,
  FileText,
  FolderOpen,
  ArrowRightLeft,
  User,
  Clock,
  ChevronDown,
} from 'lucide-react'

const EVENT_TYPES = [
  'proyecto_creado',
  'proyecto_actualizado',
  'proyecto_eliminado',
  'proyecto_transicion',
  'documento_creado',
  'documento_actualizado',
  'documento_eliminado',
  'documento_transicion',
]

const LIMIT_OPTIONS = [50, 100, 250]

function getEventBadgeColor(event: string): string {
  if (event.includes('creado')) return 'bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]'
  if (event.includes('eliminado')) return 'bg-[#fef2f2] text-[#991b1b] border-[#fecaca]'
  if (event.includes('actualizado')) return 'bg-[#eff6ff] text-[#1e40af] border-[#bfdbfe]'
  if (event.includes('transicion')) return 'bg-[#fffbeb] text-[#92400e] border-[#fde68a]'
  return 'bg-[#f3f4f6] text-[#374151] border-[#e5e7eb]'
}

function getEventIcon(event: string) {
  if (event.includes('creado')) return <FileText size={14} className="mr-1" />
  if (event.includes('eliminado')) return <AlertCircle size={14} className="mr-1" />
  if (event.includes('actualizado')) return <FolderOpen size={14} className="mr-1" />
  if (event.includes('transicion')) return <ArrowRightLeft size={14} className="mr-1" />
  return <Activity size={14} className="mr-1" />
}

function parseDetalle(detalle: string | null): string {
  if (!detalle) return '-'
  try {
    const obj = JSON.parse(detalle)
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ')
  } catch {
    return detalle
  }
}

function fmtDate(ts: string): string {
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

export default function TasksPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { eventos, stats, loading, error, cargar } = useAuditoria()
  const [filtroEvento, setFiltroEvento] = useState('')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')
  const [limit, setLimit] = useState(100)
  const [toast, setToast] = useState<string | null>(null)

  // Proteger ruta: solo admin
  useEffect(() => {
    if (user && user.rol !== 'admin') {
      navigate('/')
    }
  }, [user, navigate])

  // Cargar datos cuando cambian filtros
  useEffect(() => {
    if (user?.rol === 'admin') {
      cargar(
        {
          event: filtroEvento || undefined,
          desde: filtroDesde || undefined,
          hasta: filtroHasta || undefined,
        },
        limit
      )
    }
  }, [user, cargar, filtroEvento, filtroDesde, filtroHasta, limit])

  // Auto-clear toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const handleClearFilters = () => {
    setFiltroEvento('')
    setFiltroDesde('')
    setFiltroHasta('')
    setLimit(100)
  }

  const handleRefresh = () => {
    cargar(
      {
        event: filtroEvento || undefined,
        desde: filtroDesde || undefined,
        hasta: filtroHasta || undefined,
      },
      limit
    )
    setToast('Audit log refreshed')
  }

  if (!user || user.rol !== 'admin') return null

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] px-4 py-3 rounded-md text-[13px] shadow-sm">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2">
            <LayoutGrid size={18} className="text-[#6b7280]" />
            <h1 className="text-lg font-semibold text-[#111827]">Audit Log</h1>
          </div>
          <p className="text-[13px] text-[#9ca3af] mt-1">
            System events and activity tracking
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-[#e5e7eb] bg-white text-[13px] text-[#374151] hover:bg-[#f9fafb] transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
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
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Events */}
          <div className="border border-[#e5e7eb] rounded-lg bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={14} className="text-[#6b7280]" />
              <span className="text-[12px] text-[#6b7280]">Total Events</span>
            </div>
            <div className="text-2xl font-bold text-[#111827]">{stats.total}</div>
          </div>

          {/* Cards por tipo (top 3) */}
          {stats.por_tipo.slice(0, 3).map((item) => (
            <div
              key={item.event}
              className="border border-[#e5e7eb] rounded-lg bg-white p-4"
            >
              <div className="flex items-center gap-2 mb-2 text-[12px] text-[#6b7280] capitalize">
                {getEventIcon(item.event)}
                <span className="truncate">{item.event.replace(/_/g, ' ')}</span>
              </div>
              <div className="text-2xl font-bold text-[#111827]">{item.count}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1 text-[13px] text-[#6b7280]">
          <Filter size={14} />
          <span>Filters</span>
        </div>

        {/* Event type */}
        <div className="relative">
          <select
            value={filtroEvento}
            onChange={(e) => setFiltroEvento(e.target.value)}
            className="appearance-none pr-8 pl-3 py-2 rounded-md border border-[#e5e7eb] bg-white text-[13px] text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#d1d5db]"
          >
            <option value="">All event types</option>
            {EVENT_TYPES.map((et) => (
              <option key={et} value={et}>
                {et.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none"
          />
        </div>

        {/* Desde */}
        <div className="flex items-center gap-1">
          <Calendar size={14} className="text-[#9ca3af]" />
          <input
            type="datetime-local"
            value={filtroDesde}
            onChange={(e) => setFiltroDesde(e.target.value)}
            className="px-3 py-2 rounded-md border border-[#e5e7eb] bg-white text-[13px] text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#d1d5db]"
          />
        </div>

        {/* Hasta */}
        <div className="flex items-center gap-1">
          <span className="text-[13px] text-[#9ca3af]">to</span>
          <input
            type="datetime-local"
            value={filtroHasta}
            onChange={(e) => setFiltroHasta(e.target.value)}
            className="px-3 py-2 rounded-md border border-[#e5e7eb] bg-white text-[13px] text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#d1d5db]"
          />
        </div>

        {/* Limit */}
        <div className="relative">
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="appearance-none pr-8 pl-3 py-2 rounded-md border border-[#e5e7eb] bg-white text-[13px] text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#d1d5db]"
          >
            {LIMIT_OPTIONS.map((l) => (
              <option key={l} value={l}>
                {l} results
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none"
          />
        </div>

        {/* Clear */}
        <button
          onClick={handleClearFilters}
          className="px-4 py-2 rounded-md border border-[#e5e7eb] bg-white text-[13px] text-[#374151] hover:bg-[#f9fafb] transition-colors"
        >
          Clear filters
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-[13px] text-[#9ca3af]">
          <RefreshCw size={16} className="animate-spin mr-2" />
          Loading events...
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
                <th className="px-4 py-3 text-left font-semibold text-[#374151] text-[12px] uppercase tracking-wide w-[160px]">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[#374151] text-[12px] uppercase tracking-wide w-[180px]">
                  Event
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[#374151] text-[12px] uppercase tracking-wide w-[120px]">
                  User
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[#374151] text-[12px] uppercase tracking-wide">
                  Detail
                </th>
              </tr>
            </thead>
            <tbody>
              {eventos.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-[#9ca3af]"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Activity size={24} className="text-[#d1d5db]" />
                      <span>No events found</span>
                      <span className="text-[12px]">
                        Try adjusting your filters or refresh the page
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                eventos.map((ev) => (
                  <tr
                    key={ev.id}
                    className="border-b border-[#f3f4f6] hover:bg-[#f9fafb] transition-colors"
                  >
                    <td className="px-4 py-3 text-[#6b7280] font-mono text-[12px]">
                      #{ev.id}
                    </td>
                    <td className="px-4 py-3 text-[#374151]">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-[#9ca3af] shrink-0" />
                        {fmtDate(ev.timestamp)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border capitalize ${getEventBadgeColor(
                          ev.event
                        )}`}
                      >
                        {getEventIcon(ev.event)}
                        {ev.event.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-[#374151]">
                        <User size={13} className="text-[#9ca3af] shrink-0" />
                        {ev.username || (
                          <span className="text-[#9ca3af] italic">system</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#6b7280] max-w-[400px] truncate">
                      {parseDetalle(ev.detalle)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer info */}
      {!loading && eventos.length > 0 && (
        <div className="mt-4 text-[12px] text-[#9ca3af] flex items-center justify-between">
          <span>
            Showing {eventos.length} of {stats?.total ?? eventos.length} events
          </span>
          <span className="flex items-center gap-1">
            <Activity size={12} />
            Auto-registered by system
          </span>
        </div>
      )}
    </div>
  )
}
