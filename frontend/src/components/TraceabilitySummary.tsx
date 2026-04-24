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

const MODULO_COLORS: Record<string, string> = {
  EST: '#ef4444',
  HAB: '#10b981',
  MDS: '#3b82f6',
}

export default function TraceabilitySummary({ porModulo }: TraceabilitySummaryProps) {
  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ margin: '0 0 20px', fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Traceability Summary
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {porModulo.map((m) => {
          const progress = m.total > 0 ? Math.round((m.aprobados / m.total) * 100) : 0
          const color = MODULO_COLORS[m.modulo] || '#6b7280'

          return (
            <div key={m.modulo}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      background: color,
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                    {MODULO_LABELS[m.modulo] || m.modulo}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>{progress}%</span>
              </div>

              <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, marginBottom: 8, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: progress === 100 ? '#10b981' : color,
                    borderRadius: 3,
                    transition: 'width 0.4s ease',
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
