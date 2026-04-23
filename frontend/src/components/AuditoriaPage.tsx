import { useEffect, useState } from 'react'
import { useAuditoria } from '../hooks/useAuditoria'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const EVENT_TYPES = [
  'proyecto_creado',
  'proyecto_actualizado',
  'proyecto_eliminado',
  'documento_creado',
  'documento_actualizado',
  'documento_eliminado',
]

export default function AuditoriaPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { eventos, stats, loading, error, cargar } = useAuditoria()

  const [filtroEvento, setFiltroEvento] = useState('')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')
  const [limit, setLimit] = useState(100)

  // Redirigir si no es admin
  useEffect(() => {
    if (user && user.rol !== 'admin') {
      navigate('/')
    }
  }, [user, navigate])

  useEffect(() => {
    if (user?.rol === 'admin') {
      cargar({
        event: filtroEvento || undefined,
        desde: filtroDesde || undefined,
        hasta: filtroHasta || undefined,
      }, limit)
    }
  }, [user, cargar, filtroEvento, filtroDesde, filtroHasta, limit])

  if (!user || user.rol !== 'admin') return null

  return (
    <div>
      <h1 style={{ margin: '0 0 24px' }}>Auditoria de Eventos</h1>

      {error && <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 12 }}>{error}</p>}

      {/* Estadisticas */}
      {stats && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ padding: '12px 16px', background: '#f3f4f6', borderRadius: 8, minWidth: 120 }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.total}</div>
            <div style={{ fontSize: 12, color: '#666' }}>Total eventos</div>
          </div>
          {stats.por_tipo.map(t => (
            <div key={t.event} style={{ padding: '12px 16px', background: '#eff6ff', borderRadius: 8, minWidth: 120 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1e40af' }}>{t.count}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{t.event}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={filtroEvento}
          onChange={e => setFiltroEvento(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }}
        >
          <option value="">Todos los eventos</option>
          {EVENT_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={filtroDesde}
          onChange={e => setFiltroDesde(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }}
        />
        <input
          type="datetime-local"
          value={filtroHasta}
          onChange={e => setFiltroHasta(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }}
        />
        <select
          value={limit}
          onChange={e => setLimit(Number(e.target.value))}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }}
        >
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={250}>250</option>
          <option value={500}>500</option>
        </select>
        <button
          onClick={() => { setFiltroEvento(''); setFiltroDesde(''); setFiltroHasta('') }}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Limpiar
        </button>
      </div>

      {/* Tabla */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
            <th style={{ padding: '10px 12px', borderBottom: '1px solid #ddd' }}>ID</th>
            <th style={{ padding: '10px 12px', borderBottom: '1px solid #ddd' }}>Timestamp</th>
            <th style={{ padding: '10px 12px', borderBottom: '1px solid #ddd' }}>Evento</th>
            <th style={{ padding: '10px 12px', borderBottom: '1px solid #ddd' }}>Usuario</th>
            <th style={{ padding: '10px 12px', borderBottom: '1px solid #ddd' }}>Detalle</th>
          </tr>
        </thead>
        <tbody>
          {eventos.map(e => (
            <tr key={e.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px 12px' }}>{e.id}</td>
              <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>{e.timestamp}</td>
              <td style={{ padding: '8px 12px' }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 600,
                  background: e.event?.includes('creado') ? '#dcfce7' : e.event?.includes('eliminado') ? '#fee2e2' : '#dbeafe',
                  color: e.event?.includes('creado') ? '#166534' : e.event?.includes('eliminado') ? '#991b1b' : '#1e40af',
                }}>
                  {e.event}
                </span>
              </td>
              <td style={{ padding: '8px 12px' }}>{e.username || '-'}</td>
              <td style={{ padding: '8px 12px', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {e.detalle || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {eventos.length === 0 && !loading && (
        <p style={{ textAlign: 'center', color: '#999', marginTop: 32 }}>No hay eventos registrados.</p>
      )}
    </div>
  )
}
