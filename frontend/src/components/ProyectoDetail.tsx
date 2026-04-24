import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProyectoDetail } from '../hooks/useProyectoDetail'
import ExportButton from './ExportButton'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const COLORS_ESTADO = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444']
const ESTADO_LABELS: Record<string, string> = { ING: 'Ingreso', OBS: 'Observado', COR: 'Corregido', APB: 'Aprobado' }
const ESTADO_BG: Record<string, string> = { ING: '#fef3c7', OBS: '#fee2e2', COR: '#dbeafe', APB: '#dcfce7' }
const ESTADO_COLOR: Record<string, string> = { ING: '#92400e', OBS: '#991b1b', COR: '#1e40af', APB: '#166534' }

export default function ProyectoDetail() {
  const { id } = useParams<{ id: string }>()
  const { detalle, loading, error, cargarDetalle } = useProyectoDetail()

  useEffect(() => {
    if (id) cargarDetalle(Number(id))
  }, [id, cargarDetalle])

  if (loading) return <p>Cargando detalle...</p>
  if (error) return <p style={{ color: '#dc2626' }}>{error}</p>
  if (!detalle) return null

  const { proyecto, documentos, estadisticas, eventos_recientes } = detalle

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>
              <Link to="/proyectos" style={{ color: '#2563eb', textDecoration: 'none' }}>Proyectos</Link>
              {' / '}
              <span>Detalle</span>
            </div>
            <h1 style={{ margin: 0 }}>{proyecto.nombre}</h1>
          </div>
          <ExportButton entidad="documentos" label="Exportar documentos CSV" />
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
          <Badge label="Acronimo" value={proyecto.acronimo} />
          <Badge label="Etapa" value={proyecto.etapa_actual} color={proyecto.etapa_actual === 'APB' ? '#166534' : '#374151'} bg={proyecto.etapa_actual === 'APB' ? '#dcfce7' : '#f3f4f6'} />
          <Badge label="Cliente" value={proyecto.cliente || '—'} />
          {proyecto.ubicacion && <Badge label="Ubicacion" value={proyecto.ubicacion} />}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KPI label="Documentos" value={estadisticas.total_documentos} color="#7c3aed" />
        <KPI label="Observaciones" value={estadisticas.observaciones_pendientes.length} color="#dc2626" />
        <KPI label="Modulos" value={estadisticas.por_modulo.length} color="#059669" />
        <KPI label="Etapa actual" value={proyecto.etapa_actual} color="#2563eb" />
      </div>

      {/* Graficos */}
      {estadisticas.total_documentos > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 24 }}>
          <ChartCard title="Documentos por Estado">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={estadisticas.por_estado.map(d => ({ name: ESTADO_LABELS[d.estado] || d.estado, value: d.count }))}
                  cx="50%" cy="50%" outerRadius={70} dataKey="value" label
                >
                  {estadisticas.por_estado.map((_, i) => (
                    <Cell key={i} fill={COLORS_ESTADO[i % COLORS_ESTADO.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Documentos por Modulo">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={estadisticas.por_modulo}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="modulo" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Alertas de observaciones */}
      {estadisticas.observaciones_pendientes.length > 0 && (
        <div style={{ marginBottom: 24, padding: 16, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca' }}>
          <h3 style={{ margin: '0 0 12px', color: '#991b1b', fontSize: 14 }}>
            Observaciones pendientes ({estadisticas.observaciones_pendientes.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {estadisticas.observaciones_pendientes.map(o => (
              <div key={o.id} style={{ padding: '8px 12px', background: '#fff', borderRadius: 6, fontSize: 13 }}>
                <strong>{o.nombre}</strong> ({o.modulo}/{o.etapa})
                {o.observacion && <span style={{ color: '#6b7280', marginLeft: 8 }}>- {o.observacion}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de documentos */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Documentos ({documentos.length})</h2>
        {documentos.length === 0 ? (
          <p style={{ color: '#999' }}>Sin documentos asociados.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: 8 }}>ID</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Nombre</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Modulo</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Etapa</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Estado</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Tipo</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Observacion</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>{d.id}</td>
                  <td style={{ padding: 8 }}>{d.nombre}</td>
                  <td style={{ padding: 8 }}><code>{d.modulo}</code></td>
                  <td style={{ padding: 8 }}>{d.etapa}</td>
                  <td style={{ padding: 8 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: ESTADO_BG[d.estado] || '#f3f4f6',
                      color: ESTADO_COLOR[d.estado] || '#374151',
                    }}>
                      {ESTADO_LABELS[d.estado] || d.estado}
                    </span>
                  </td>
                  <td style={{ padding: 8 }}>{d.tipo}</td>
                  <td style={{ padding: 8, color: '#6b7280', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.observacion || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Timeline de eventos */}
      {eventos_recientes.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Actividad reciente</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {eventos_recientes.map(e => (
              <div key={e.id} style={{ padding: '8px 12px', borderRadius: 6, background: '#f9fafb', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  <strong style={{ color: '#374151' }}>{e.event}</strong>
                  {e.detalle && <span style={{ color: '#6b7280', marginLeft: 8 }}>{e.detalle}</span>}
                </span>
                <span style={{ color: '#9ca3af', fontSize: 12 }}>
                  {e.fecha_creacion ? new Date(e.fecha_creacion).toLocaleString() : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function KPI({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={{ padding: 16, borderRadius: 8, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

function Badge({ label, value, color, bg }: { label: string; value: string; color?: string; bg?: string }) {
  return (
    <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: bg || '#f3f4f6', color: color || '#374151' }}>
      <span style={{ color: '#6b7280' }}>{label}:</span> <strong>{value}</strong>
    </span>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#374151' }}>{title}</h3>
      {children}
    </div>
  )
}
