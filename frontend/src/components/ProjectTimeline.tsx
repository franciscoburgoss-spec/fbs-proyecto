interface ProjectTimelineProps {
  etapaActual: string
}

const ETAPAS = ['CHK', 'R1', 'R2', 'R3', 'APB']

export default function ProjectTimeline({ etapaActual }: ProjectTimelineProps) {
  const currentIndex = ETAPAS.indexOf(etapaActual)

  // Ancho disponible: 320px card - 40px padding (20px cada lado) = 280px
  // 5 cajas + 4 conectores = necesitamos ajustar para que quepa
  const boxSize = 44      // caja 44x40
  const connectorWidth = 8 // conector pequeño
  // Total: 5*44 + 4*8 = 220 + 32 = 252px < 280px ✓

  return (
    <div style={{ padding: '16px 20px 20px' }}>
      <h3
        style={{
          margin: '0 0 16px',
          fontSize: 13,
          fontWeight: 700,
          color: '#374151',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          fontFamily: 'inherit',
        }}
      >
        Project Status Timeline
      </h3>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
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
                  width: boxSize,
                  height: 40,
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  border: isCompleted
                    ? '1px solid #a7f3d0'
                    : isCurrent
                      ? '1.5px solid #3b82f6'
                      : '1px solid #e5e7eb',
                  background: isCompleted
                    ? '#ecfdf5'
                    : isCurrent
                      ? '#eff6ff'
                      : '#f9fafb',
                  color: isCompleted ? '#10b981' : isCurrent ? '#3b82f6' : '#9ca3af',
                  cursor: 'default',
                  transition: 'all 0.15s',
                }}
              >
                {isCompleted ? (
                  <span style={{ fontSize: 16 }}>&#10003;</span>
                ) : (
                  etapa
                )}
              </div>

              {/* Arrow connector (except last) */}
              {index < ETAPAS.length - 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: connectorWidth,
                    color: isCompleted ? '#a7f3d0' : '#e5e7eb',
                    fontSize: 12,
                    fontWeight: 700,
                    userSelect: 'none',
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
