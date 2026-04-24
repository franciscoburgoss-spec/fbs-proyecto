interface ProjectTimelineProps {
  etapaActual: string
}

const ETAPAS = ['CHK', 'R1', 'R2', 'R3', 'APB']

const ETAPA_LABELS: Record<string, string> = {
  CHK: 'Check',
  R1: 'Review 1',
  R2: 'Review 2',
  R3: 'Review 3',
  APB: 'Approved',
}

export default function ProjectTimeline({ etapaActual }: ProjectTimelineProps) {
  const currentIndex = ETAPAS.indexOf(etapaActual)

  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ margin: '0 0 20px', fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Project Status Timeline
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {ETAPAS.map((etapa, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex
          const isFuture = index > currentIndex

          return (
            <div key={etapa} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Circle */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: isCompleted ? '#10b981' : isCurrent ? '#3b82f6' : '#f3f4f6',
                  color: isCompleted || isCurrent ? '#fff' : '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  border: isFuture ? '2px solid #e5e7eb' : 'none',
                  flexShrink: 0,
                }}
              >
                {isCompleted ? '✓' : isCurrent ? '●' : index + 1}
              </div>

              {/* Label */}
              <div style={{ flex: 1, padding: '10px 0' }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: isCurrent ? 600 : 400,
                    color: isCurrent ? '#111827' : isCompleted ? '#374151' : '#9ca3af',
                  }}
                >
                  {ETAPA_LABELS[etapa]}
                </div>
                <div style={{ fontSize: 11, color: isCompleted ? '#10b981' : isCurrent ? '#3b82f6' : '#d1d5db', marginTop: 2 }}>
                  {isCompleted ? 'Completed' : isCurrent ? 'In Progress' : 'Pending'}
                </div>
              </div>

              {/* Connector line (except last) */}
              {index < ETAPAS.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    left: 34,
                    marginTop: 34,
                    width: 2,
                    height: 24,
                    background: isCompleted ? '#10b981' : '#e5e7eb',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
