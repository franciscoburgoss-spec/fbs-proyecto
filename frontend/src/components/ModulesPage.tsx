import { useEffect, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  FolderOpen,
  FileText,
  Users,
  Activity,
  Download,
  AlertCircle,
} from 'lucide-react'
import { useReportes } from '../hooks/useReportes'
import { exportarCSV } from '../api'
import type { ReporteDocumentos } from '../types'

const STATUS_COLORS: Record<string, string> = {
  APB: '#16a34a',
  ING: '#3b82f6',
  COR: '#f59e0b',
  OBS: '#ef4444',
}

const STAGE_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']

export default function ModulesPage() {
  const { general, documentos, loading, error, cargarGeneral, cargarDocumentos } =
    useReportes()
  const [toast, setToast] = useState<string | null>(null)
  const [observaciones, setObservaciones] = useState<
    ReporteDocumentos['observaciones_pendientes']
  >([])

  useEffect(() => {
    cargarGeneral()
    cargarDocumentos()
  }, [cargarGeneral, cargarDocumentos])

  useEffect(() => {
    if (documentos?.observaciones_pendientes) {
      setObservaciones(documentos.observaciones_pendientes)
    }
  }, [documentos])

  const handleExport = async (entidad: 'proyectos' | 'documentos') => {
    try {
      await exportarCSV(entidad)
      setToast(`${entidad === 'proyectos' ? 'Projects' : 'Documents'} exported successfully`)
      setTimeout(() => setToast(null), 3000)
    } catch (e: any) {
      setToast(e.response?.data?.detail || 'Export error')
      setTimeout(() => setToast(null), 3000)
    }
  }

  const kpis = general
    ? [
        {
          label: 'Total Projects',
          value: general.totales.proyectos,
          icon: FolderOpen,
          color: '#3b82f6',
          bg: '#eff6ff',
        },
        {
          label: 'Total Documents',
          value: general.totales.documentos,
          icon: FileText,
          color: '#10b981',
          bg: '#f0fdf4',
        },
        {
          label: 'Total Users',
          value: general.totales.usuarios,
          icon: Users,
          color: '#8b5cf6',
          bg: '#f5f3ff',
        },
        {
          label: 'Total Events',
          value: general.totales.eventos,
          icon: Activity,
          color: '#f59e0b',
          bg: '#fffbeb',
        },
      ]
    : []

  const docPorEstado = general?.documentos_por_estado || []
  const projPorEtapa = general?.proyectos_por_etapa || []
  const evolucion = general?.evolucion_proyectos || []

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-[70px] right-6 z-50 rounded-lg px-4 py-3 flex items-center gap-2 shadow-md animate-[slideIn_0.3s_ease] ${
            toast.includes('Error') || toast.includes('error')
              ? 'bg-[#fef2f2] border border-[#fecaca]'
              : 'bg-[#ecfdf5] border border-[#a7f3d0]'
          }`}
        >
          <span
            className={`w-[18px] h-[18px] rounded-full text-white flex items-center justify-center text-[10px] shrink-0 ${
              toast.includes('Error') || toast.includes('error')
                ? 'bg-[#ef4444]'
                : 'bg-[#10b981]'
            }`}
          >
            {toast.includes('Error') || toast.includes('error') ? '!' : '✓'}
          </span>
          <span
            className={`text-[13px] font-medium ${
              toast.includes('Error') || toast.includes('error')
                ? 'text-[#991b1b]'
                : 'text-[#065f46]'
            }`}
          >
            {toast}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-[#111827]">Reports</h1>
          <p className="text-[13px] text-[#9ca3af] mt-1">
            System overview and analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('proyectos')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md border border-[#e5e7eb] bg-white text-[13px] font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={2} />
            Export Projects CSV
          </button>
          <button
            onClick={() => handleExport('documentos')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md border border-[#111827] bg-[#111827] text-[13px] font-medium text-white hover:bg-[#374151] transition-colors"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={2} />
            Export Documents CSV
          </button>
        </div>
      </div>

      {loading && (
        <p className="p-6 text-center text-[#9ca3af]">Loading reports...</p>
      )}

      {error && (
        <div className="p-4 mb-4 rounded-lg bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-[13px]">
          {error}
        </div>
      )}

      {!loading && general && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="bg-white border border-[#e5e7eb] rounded-lg p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[12px] font-medium text-[#6b7280] uppercase tracking-wide">
                    {kpi.label}
                  </span>
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: kpi.bg }}
                  >
                    <kpi.icon
                      className="w-4 h-4"
                      strokeWidth={2}
                      style={{ color: kpi.color }}
                    />
                  </div>
                </div>
                <div className="text-[28px] font-bold text-[#111827]">
                  {kpi.value}
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Pie Chart - Documents by Status */}
            <div className="bg-white border border-[#e5e7eb] rounded-lg p-5">
              <h3 className="text-[13px] font-semibold text-[#374151] mb-4">
                Documents by Status
              </h3>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={docPorEstado}
                      dataKey="count"
                      nameKey="estado"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {docPorEstado.map((entry) => (
                        <Cell
                          key={entry.estado}
                          fill={STATUS_COLORS[entry.estado] || '#9ca3af'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      formatter={(value: string) => (
                        <span className="text-[12px] text-[#374151]">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart - Projects by Stage */}
            <div className="bg-white border border-[#e5e7eb] rounded-lg p-5">
              <h3 className="text-[13px] font-semibold text-[#374151] mb-4">
                Projects by Stage
              </h3>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projPorEtapa}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f3f4f6"
                    />
                    <XAxis
                      dataKey="etapa_actual"
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {projPorEtapa.map((_, index) => (
                        <Cell
                          key={index}
                          fill={STAGE_COLORS[index % STAGE_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Line Chart - Project Evolution */}
          <div className="bg-white border border-[#e5e7eb] rounded-lg p-5 mb-6">
            <h3 className="text-[13px] font-semibold text-[#374151] mb-4">
              Project Evolution by Month
            </h3>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolucion}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f3f4f6"
                  />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pending Observations Table */}
          <div className="bg-white border border-[#e5e7eb] rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-[#e5e7eb] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#ef4444]" strokeWidth={2} />
              <h3 className="text-[13px] font-semibold text-[#374151]">
                Pending Observations
              </h3>
              <span className="ml-auto text-[11px] font-medium text-[#6b7280] bg-[#f3f4f6] px-2 py-0.5 rounded-full">
                {observaciones.length} items
              </span>
            </div>

            {observaciones.length === 0 ? (
              <div className="px-5 py-8 text-center text-[13px] text-[#9ca3af]">
                No pending observations found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e5e7eb] bg-[#fafafa]">
                      <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide">
                        Document
                      </th>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide">
                        Module
                      </th>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide">
                        Stage
                      </th>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide">
                        Observation
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {observaciones.map((obs) => (
                      <tr
                        key={obs.id}
                        className="border-b border-[#f3f4f6] hover:bg-[#fafafa] transition-colors"
                      >
                        <td className="px-5 py-3">
                          <div className="text-[13px] font-medium text-[#111827]">
                            {obs.nombre}
                          </div>
                          <div className="text-[11px] text-[#9ca3af] mt-0.5">
                            {obs.acronimo}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className="inline-flex items-center justify-center rounded-full text-[11px] font-medium px-2 py-0.5"
                            style={{
                              backgroundColor:
                                obs.modulo === 'EST'
                                  ? '#eff6ff'
                                  : obs.modulo === 'HAB'
                                    ? '#f0fdf4'
                                    : '#fffbeb',
                              color:
                                obs.modulo === 'EST'
                                  ? '#2563eb'
                                  : obs.modulo === 'HAB'
                                    ? '#16a34a'
                                    : '#d97706',
                            }}
                          >
                            {obs.modulo}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-[12px] text-[#6b7280] font-medium">
                            {obs.etapa}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-[12px] text-[#ef4444]">
                            {obs.observacion}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
