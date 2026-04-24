interface ProjectTimelineProps {
  etapaActual: string
}

const ETAPAS = ['CHK', 'R1', 'R2', 'R3', 'APB']

export default function ProjectTimeline({ etapaActual }: ProjectTimelineProps) {
  const currentIndex = ETAPAS.indexOf(etapaActual)

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
        Project Status Timeline
      </h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {ETAPAS.map((etapa, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex

          return (
            <div key={etapa} style={{ display: 'flex', alignItems: 'center' }}>
              {/* Stage box */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  border: isCompleted
                    ? '1px solid #10b981'
                    : isCurrent
                      ? '1px solid #3b82f6'
                      : '1px solid #e5e7eb',
                  background: isCompleted
                    ? '#d1fae5'
                    : isCurrent
                      ? '#dbeafe'
                      : '#f9fafb',
                  color: isCompleted ? '#065f46' : isCurrent ? '#1e40af' : '#9ca3af',
                  whiteSpace: 'nowrap',
                  minWidth: 44,
                }}
              >
                {isCompleted && (
                  <span style={{ fontSize: 13 }}>&#10003;</span>
                )}
                {isCurrent && (
                  <span style={{ fontSize: 10 }}>&#9679;</span>
                )}
                {etapa}
              </div>

              {/* Arrow connector (except last) */}
              {index < ETAPAS.length - 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 20,
                    color: isCompleted ? '#10b981' : '#d1d5db',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  &#8250;
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
