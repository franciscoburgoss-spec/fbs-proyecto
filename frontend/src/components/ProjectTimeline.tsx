interface ProjectTimelineProps {
  etapaActual: string
}

const ETAPAS = ['CHK', 'R1', 'R2', 'R3', 'APB']

export default function ProjectTimeline({ etapaActual }: ProjectTimelineProps) {
  const currentIndex = ETAPAS.indexOf(etapaActual)

  return (
    <div className="px-5 pt-4 pb-5">
      <h3 className="text-[13px] font-bold text-[#374151] uppercase tracking-[0.5px] mb-4">
        Project Status Timeline
      </h3>

      <div className="flex items-center justify-center">
        {ETAPAS.map((etapa, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex

          return (
            <div key={etapa} className="flex items-center">
              <div
                className={[
                  'flex items-center justify-center w-11 h-10 rounded-lg text-xs font-bold transition-all',
                  isCompleted
                    ? 'bg-[#ecfdf5] border border-[#a7f3d0] text-[#10b981]'
                    : isCurrent
                      ? 'bg-[#eff6ff] border-[1.5px] border-[#3b82f6] text-[#3b82f6]'
                      : 'bg-[#f9fafb] border border-[#e5e7eb] text-[#9ca3af]',
                ].join(' ')}
              >
                {isCompleted ? <span className="text-base">&#10003;</span> : etapa}
              </div>
              {index < ETAPAS.length - 1 && (
                <div className={`flex items-center justify-center w-2 text-xs font-bold select-none ${isCompleted ? 'text-[#a7f3d0]' : 'text-[#e5e7eb]'}`}>
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
