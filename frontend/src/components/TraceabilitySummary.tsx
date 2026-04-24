interface ModuloStat {
  modulo: string
  total: number
  aprobados: number
  pendientes: number
}

interface TraceabilitySummaryProps {
  porModulo: ModuloStat[]
}

const MODULO_LABELS: Record<string, string> = {
  EST: 'Module EST',
  HAB: 'Module HAB',
  MDS: 'Module MDS',
}

export default function TraceabilitySummary({ porModulo }: TraceabilitySummaryProps) {
  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#374151' }}>
        Traceability Summary
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {porModulo.map((m) => {
          const progress = m.total > 0 ? Math.round((m.aprobados / m.total) * 100) : 0
          return (
            <div key={m.modulo} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                  {MODULO_LABELS[m.modulo] || m.modulo}
                </span>
                <span style={{ fontSize: 12, color: '#6b7280' }}>{progress}%</span>
              </div>
              <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, marginBottom: 8, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: progress === 100 ? '#10b981' : '#3b82f6',
                    borderRadius: 3,
                    transition: 'width 0.3s',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#10b981', fontWeight: 500 }}>
                  Approved ({m.aprobados}/{m.total})
                </span>
                <span style={{ color: '#f59e0b', fontWeight: 500 }}>
                  Pending ({m.pendientes})
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
