import { useEffect } from 'react'
import { useReportes } from '../hooks/useReportes'
import { useStats } from '../hooks/useStats'
import { Link } from 'react-router-dom'
import ExportButton from './ExportButton'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line,
} from 'recharts'

const COLORS_ESTADO = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444']

const ETAPA_LABELS: Record<string, string> = {
  CHK: 'Chk',
  R1: 'R1',
  R2: 'R2',
  R3: 'R3',
}

const ESTADO_LABELS: Record<string, string> = {
  ING: 'Ingreso',
  OBS: 'Observado',
  COR: 'Corregido',
  APB: 'Aprobado',
}

export default function Dashboard() {
  const { stats } = useStats()
  const { general, loading, error, cargarGeneral } = useReportes()

  useEffect(() => {
    cargarGeneral()
  }, [cargarGeneral])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <ExportButton entidad="proyectos" />
          <ExportButton entidad="documentos" />
        </div>
      </div>

      {error && <p style={{ color: '#dc2626' }}>{error}</p>}
      {loading && !general && <p>Cargando reportes...</p>}

      {/* KPIs superiores */}
      {general && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          <KPICard title="Proyectos" value={general.totales.proyectos} color="#2563eb" link="/proyectos" />
          <KPICard title="Documentos" value={general.totales.documentos} color="#7c3aed" link="/documentos" />
          <KPICard title="Usuarios" value={general.totales.usuarios} color="#059669" link="/admin" />
          <KPICard title="Eventos" value={general.totales.eventos} color="#dc2626" link="/auditoria" />
        </div>
      )}

      {/* Graficos */}
      {general && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 32 }}>
          {/* Pie Chart - Documentos por Estado */}
          <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#374151' }}>Documentos por Estado</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={general.documentos_por_estado.map(d => ({ name: ESTADO_LABELS[d.estado] || d.estado, value: d.count }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label
                >
                  {general.documentos_por_estado.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={COLORS_ESTADO[i % COLORS_ESTADO.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart - Proyectos por Etapa */}
          <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#374151' }}>Proyectos por Etapa</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={general.proyectos_por_etapa.map(d => ({ name: ETAPA_LABELS[d.etapa_actual] || d.etapa_actual, value: d.count }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Line Chart - Evolucion de Proyectos */}
          <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#374151' }}>Evolucion de Proyectos (ultimos 6 meses)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={[...general.evolucion_proyectos].reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Observaciones pendientes */}
          <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#374151' }}>Resumen Rapido</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats?.por_estado && Object.entries(stats.por_estado).map(([estado, count]) => (
                <div key={estado} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>{ESTADO_LABELS[estado] || estado}</span>
                  <span style={{
                    padding: '2px 10px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 600,
                    background: estado === 'APB' ? '#dcfce7' : estado === 'OBS' ? '#fee2e2' : estado === 'COR' ? '#dbeafe' : '#fef3c7',
                    color: estado === 'APB' ? '#166534' : estado === 'OBS' ? '#991b1b' : estado === 'COR' ? '#1e40af' : '#92400e',
                  }}>
                    {count as number}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sin datos */}
      {!general && !loading && !error && (
        <p style={{ textAlign: 'center', color: '#999' }}>No hay datos disponibles.</p>
      )}
    </div>
  )
}

function KPICard({ title, value, color, link }: { title: string; value: number; color: string; link: string }) {
  return (
    <Link to={link} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        padding: 20,
        borderRadius: 8,
        borderLeft: `4px solid ${color}`,
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'transform 0.2s',
      }}>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      </div>
    </Link>
  )
}
