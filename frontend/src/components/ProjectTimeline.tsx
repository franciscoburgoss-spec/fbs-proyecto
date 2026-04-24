interface ProjectTimelineProps {
  etapaActual: string
}

const ETAPAS = ['CHK', 'R1', 'R2', 'R3', 'APB']

const ETAPA_LABELS: Record<string, string> = {
  CHK: 'CHK',
  R1: 'R1',
  R2: 'R2',
  R3: 'R3',
  APB: 'APB',
}

export default function ProjectTimeline({ etapaActual }: ProjectTimelineProps) {
  const currentIndex = ETAPAS.indexOf(etapaActual)

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#374151' }}>
        Project Status Timeline
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {ETAPAS.map((etapa, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex

          const bgColor = isCompleted
            ? '#10b981'
            : isCurrent
            ? '#3b82f6'
            : '#e5e7eb'
          const textColor = isCompleted || isCurrent ? '#fff' : '#9ca3af'
          const borderColor = isCurrent ? '#3b82f6' : 'transparent'

          return (
            <div key={etapa} style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: bgColor,
                  color: textColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  border: isCurrent ? '3px solid #93c5fd' : '2px solid ' + borderColor,
                  boxShadow: isCurrent ? '0 0 0 4px #dbeafe' : 'none',
                  transition: 'all 0.2s',
                }}
                title={ETAPA_LABELS[etapa]}
              >
                {etapa}
              </div>
              {index < ETAPAS.length - 1 && (
                <div
                  style={{
                    width: 24,
                    height: 2,
                    background: isCompleted ? '#10b981' : '#e5e7eb',
                    margin: '0 4px',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: '#6b7280' }}>
        Etapa actual: <strong style={{ color: '#374151' }}>{ETAPA_LABELS[etapaActual] || etapaActual}</strong>
      </div>
    </div>
  )
}
