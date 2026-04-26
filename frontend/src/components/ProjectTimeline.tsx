import { useState } from 'react'
import { ArrowRight, Lock } from 'lucide-react'
import ProyectoTransicionModal from './ProyectoTransicionModal'

interface ProjectTimelineProps {
  etapaActual: string
  proyectoId?: number
  onConfirmarTransicion?: (proyectoId: number, destino: string) => Promise<void>
  puedeTransicionar?: boolean
}

const ETAPAS = ['CHK', 'R1', 'R2', 'R3', 'APB']

export default function ProjectTimeline({
  etapaActual,
  proyectoId,
  onConfirmarTransicion,
  puedeTransicionar = false,
}: ProjectTimelineProps) {
  const currentIndex = ETAPAS.indexOf(etapaActual)
  const [modalOpen, setModalOpen] = useState(false)
  const [etapaDestino, setEtapaDestino] = useState<string | null>(null)

  const esClickeable = (index: number) => {
    return puedeTransicionar && proyectoId != null && index === currentIndex + 1
  }

  const handleEtapaClick = (index: number, etapa: string) => {
    if (!esClickeable(index)) return
    setEtapaDestino(etapa)
    setModalOpen(true)
  }

  return (
    <div className="px-5 pt-4 pb-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-bold text-[#374151] uppercase tracking-[0.5px]">
          Project Status Timeline
        </h3>
        {puedeTransicionar && currentIndex < ETAPAS.length - 1 && (
          <span className="text-[11px] text-[#6b7280] font-medium">
            Click next stage to advance
          </span>
        )}
      </div>

      <div className="flex items-center justify-center">
        {ETAPAS.map((etapa, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex
          const isClickable = esClickeable(index)

          return (
            <div key={etapa} className="flex items-center">
              <button
                type="button"
                onClick={() => handleEtapaClick(index, etapa)}
                disabled={!isClickable}
                className={[
                  'flex items-center justify-center w-11 h-10 rounded-lg text-xs font-bold transition-all relative',
                  isCompleted
                    ? 'bg-[#ecfdf5] border border-[#a7f3d0] text-[#10b981]'
                    : isCurrent
                      ? 'bg-[#eff6ff] border-[1.5px] border-[#3b82f6] text-[#3b82f6]'
                      : isClickable
                        ? 'bg-[#f9fafb] border border-[#e5e7eb] text-[#9ca3af] cursor-pointer hover:shadow-sm hover:border-[#3b82f6] hover:text-[#3b82f6]'
                        : 'bg-[#f9fafb] border border-[#e5e7eb] text-[#9ca3af]',
                ].join(' ')}
                title={
                  isClickable
                    ? `Advance to ${etapa}`
                    : isCurrent
                      ? 'Current stage'
                      : isCompleted
                        ? 'Completed stage'
                        : 'Locked'
                }
              >
                {isCompleted ? (
                  <span className="text-base">&#10003;</span>
                ) : (
                  etapa
                )}
                {isClickable && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#3b82f6] rounded-full border border-white" />
                )}
              </button>
              {index < ETAPAS.length - 1 && (
                <div
                  className={`flex items-center justify-center w-2 text-xs font-bold select-none ${
                    isCompleted ? 'text-[#a7f3d0]' : 'text-[#e5e7eb]'
                  }`}
                >
                  {isClickable ? (
                    <ArrowRight className="w-3 h-3 text-[#3b82f6]" />
                  ) : (
                    <span>&#8250;</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      {puedeTransicionar && currentIndex < ETAPAS.length - 1 && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#3b82f6]" />
            <span className="text-[11px] text-[#6b7280]">Ready to advance</span>
          </div>
          <div className="flex items-center gap-1">
            <Lock className="w-2.5 h-2.5 text-[#d1d5db]" />
            <span className="text-[11px] text-[#9ca3af]">Locked</span>
          </div>
        </div>
      )}

      {modalOpen && etapaDestino && proyectoId && onConfirmarTransicion && (
        <ProyectoTransicionModal
          open={modalOpen}
          etapaActual={etapaActual}
          etapaDestino={etapaDestino}
          proyectoId={proyectoId}
          onClose={() => {
            setModalOpen(false)
            setEtapaDestino(null)
          }}
          onConfirm={onConfirmarTransicion}
        />
      )}
    </div>
  )
}
