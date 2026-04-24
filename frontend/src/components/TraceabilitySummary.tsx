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
  EST: 'Module A',
  HAB: 'Module B',
  MDS: 'Module C',
}

export default function TraceabilitySummary({ porModulo }: TraceabilitySummaryProps) {
  return (
    <div style={{ padding: 20 }}>
      <h3
        style={{
          margin: '0 0 20px',
          fontSize: 13,
          fontWeight: 700,
          color: '#374151',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        Traceability Summary
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
        }}
      >
        {porModulo.map((m) => (
          <div
            key={m.modulo}
            style={{
              padding: '14px 16px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              background: '#fff',
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#111827',
                marginBottom: 8,
              }}
            >
              {MODULO_LABELS[m.modulo] || m.modulo}
            </div>
            <div
              style={{
                fontSize: 12,
                color: '#10b981',
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Approved ({m.aprobados}/{m.total})
            </div>
            <div
              style={{
                fontSize: 12,
                color: '#9ca3af',
                fontWeight: 500,
              }}
            >
              Pending ({m.pendientes})
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
