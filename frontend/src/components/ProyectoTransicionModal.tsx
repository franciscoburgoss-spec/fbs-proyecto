import { useState } from 'react'
import { ArrowRight, X, AlertCircle } from 'lucide-react'

interface ProyectoTransicionModalProps {
  open: boolean
  etapaActual: string
  etapaDestino: string
  proyectoId: number
  onClose: () => void
  onConfirm: (proyectoId: number, destino: string) => Promise<void>
}

export default function ProyectoTransicionModal({
  open,
  etapaActual,
  etapaDestino,
  proyectoId,
  onClose,
  onConfirm,
}: ProyectoTransicionModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    try {
      await onConfirm(proyectoId, etapaDestino)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error transitioning project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-[1000]" onClick={onClose}>
      <div
        className="bg-white rounded-lg min-w-[420px] max-w-[480px] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#e5e7eb] flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-[#111827]">Advance Project Stage</h3>
            <p className="text-sm text-[#6b7280] mt-1">
              Confirm the transition to the next stage.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#9ca3af] hover:text-[#374151] transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="flex items-center justify-center gap-4 py-2">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-16 h-14 rounded-lg bg-[#ecfdf5] border border-[#a7f3d0] text-[#10b981] text-sm font-bold">
                {etapaActual}
              </div>
              <span className="text-[11px] text-[#6b7280] mt-1.5 font-medium uppercase tracking-wide">Current</span>
            </div>

            <ArrowRight className="w-5 h-5 text-[#9ca3af]" />

            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-16 h-14 rounded-lg bg-[#eff6ff] border-[1.5px] border-[#3b82f6] text-[#3b82f6] text-sm font-bold">
                {etapaDestino}
              </div>
              <span className="text-[11px] text-[#3b82f6] mt-1.5 font-medium uppercase tracking-wide">Next</span>
            </div>
          </div>

          {etapaDestino === 'APB' && (
            <div className="mt-4 flex items-start gap-2 rounded-md bg-[#fffbeb] border border-[#fde68a] px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />
              <p className="text-[13px] text-[#92400e]">
                Approving the project (APB) is final. No further stage transitions will be possible.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-md bg-[#fef2f2] border border-[#fecaca] px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0 mt-0.5" />
              <p className="text-[13px] text-[#991b1b]">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e5e7eb] flex justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-md border border-[#e5e7eb] bg-white text-[#374151] text-[13px] font-medium hover:bg-[#f9fafb] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-md border border-[#111827] bg-[#111827] text-white text-[13px] font-medium hover:bg-[#374151] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {loading ? 'Processing...' : 'Confirm Advance'}
          </button>
        </div>
      </div>
    </div>
  )
}
