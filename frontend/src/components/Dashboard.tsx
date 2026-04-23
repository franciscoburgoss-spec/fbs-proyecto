import { useStats } from '../hooks/useStats'

export default function Dashboard() {
  const { stats, loading, error } = useStats()

  if (loading) return <p>Cargando...</p>
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>
  if (!stats) return null

  return (
    <div>
      <h1>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Card title="Proyectos" value={stats.total_proyectos} />
        <Card title="Documentos" value={stats.total_documentos} />
      </div>

      <h2>Por Estado (Documentos)</h2>
      <div style={{ display: 'flex', gap: 8 }}>
        {Object.entries(stats.por_estado).map(([estado, count]) => (
          <Badge key={estado} label={estado} count={count} />
        ))}
      </div>

      <h2>Por Etapa (Documentos)</h2>
      <div style={{ display: 'flex', gap: 8 }}>
        {Object.entries(stats.por_etapa).map(([etapa, count]) => (
          <Badge key={etapa} label={etapa} count={count} />
        ))}
      </div>
    </div>
  )
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
      <div style={{ fontSize: 14, color: '#666' }}>{title}</div>
      <div style={{ fontSize: 32, fontWeight: 'bold' }}>{value}</div>
    </div>
  )
}

function Badge({ label, count }: { label: string; count: number }) {
  return (
    <span style={{ background: '#e5e7eb', padding: '4px 12px', borderRadius: 12, fontSize: 14 }}>
      {label}: {count}
    </span>
  )
}
