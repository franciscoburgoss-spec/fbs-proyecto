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
    <div className="px-5 pt-4 pb-5">
      <h3 className="text-[13px] font-bold text-[#374151] uppercase tracking-[0.5px] mb-4">
        Traceability Summary
      </h3>

      <div className="grid grid-cols-2 gap-2.5">
        {porModulo.map((m) => (
          <div key={m.modulo} className="p-3.5 rounded-lg border border-[#e5e7eb] bg-white">
            <div className="text-[13px] font-bold text-[#111827] mb-2 leading-[18px]">
              {MODULO_LABELS[m.modulo] || m.modulo}
            </div>
            <div className="text-xs text-[#10b981] font-semibold mb-1 leading-4">
              Approved ({m.aprobados}/{m.total})
            </div>
            <div className="text-xs text-[#9ca3af] font-medium leading-4">
              Pending ({m.pendientes})
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
