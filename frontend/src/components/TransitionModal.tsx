import { useState } from 'react'
import type { Documento } from '../types'

interface Transition {
  desde: string
  hacia: string
  label: string
  requiereObservacion: boolean
}

interface TransitionModalProps {
  doc: Documento | null
  onClose: () => void
  onConfirm: (docId: number, nuevoEstado: string, observacion?: string) => Promise<void>
}

const TRANSICIONES: Record<string, Transition[]> = {
  ING: [{ desde: 'ING', hacia: 'OBS', label: 'estado_cambiado', requiereObservacion: true }],
  OBS: [{ desde: 'OBS', hacia: 'COR', label: 'doc_corregido', requiereObservacion: false }],
  COR: [
    { desde: 'COR', hacia: 'APB', label: 'doc_aprobado', requiereObservacion: false },
    { desde: 'COR', hacia: 'OBS', label: 'estado_cambiado', requiereObservacion: true },
  ],
  APB: [],
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  APB: { bg: 'bg-[#ecfdf5]', text: 'text-[#10b981]', border: 'border-[#a7f3d0]' },
  ING: { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]', border: 'border-[#bfdbfe]' },
  COR: { bg: 'bg-[#fffbeb]', text: 'text-[#f59e0b]', border: 'border-[#fde68a]' },
  OBS: { bg: 'bg-[#fef2f2]', text: 'text-[#ef4444]', border: 'border-[#fecaca]' },
}

export function getAvailableTransitions(estado: string): Transition[] {
  return TRANSICIONES[estado] || []
}

export default function TransitionModal({ doc, onClose, onConfirm }: TransitionModalProps) {
  const [paso, setPaso] = useState<1 | 2>(1)
  const [transicionSeleccionada, setTransicionSeleccionada] = useState<Transition | null>(null)
  const [observacion, setObservacion] = useState('')
  const [loading, setLoading] = useState(false)

  if (!doc) return null

  const transiciones = getAvailableTransitions(doc.estado)
  const currentSt = STATUS_COLORS[doc.estado] || { bg: 'bg-[#f3f4f6]', text: 'text-[#6b7280]', border: 'border-[#e5e7eb]' }

  const handleSelect = (t: Transition) => setTransicionSeleccionada(t)

  const handleContinue = () => {
    if (!transicionSeleccionada) return
    setPaso(2)
    if (!transicionSeleccionada.requiereObservacion) setObservacion('')
  }

  const handleConfirm = async () => {
    if (!doc || !transicionSeleccionada) return
    if (transicionSeleccionada.requiereObservacion && !observacion.trim()) return

    setLoading(true)
    try {
      await onConfirm(doc.id, transicionSeleccionada.hacia, transicionSeleccionada.requiereObservacion ? observacion : undefined)
      onClose()
    } catch {
      // Error handled by parent
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => { setPaso(1); setObservacion('') }

  const targetSt = transicionSeleccionada
    ? STATUS_COLORS[transicionSeleccionada.hacia] || { bg: 'bg-[#f3f4f6]', text: 'text-[#6b7280]', border: 'border-[#e5e7eb]' }
    : null

  return (
    <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-[1000]" onClick={onClose}>
      <div className="bg-white rounded-lg min-w-[420px] max-w-[480px] shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#e5e7eb] flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-[#111827]">Transition Document</h3>
            <p className="text-sm text-[#6b7280] mt-1">{doc.nombre}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-[#9ca3af] hover:text-[#6b7280] transition-colors text-lg leading-none">
            &#10005;
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Current state */}
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[13px] text-[#6b7280]">Current state:</span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-[3px] rounded text-[11px] font-bold uppercase border ${currentSt.bg} ${currentSt.text} ${currentSt.border}`}>
              {doc.estado}
            </span>
          </div>

          {paso === 1 && (
            <>
              <p className="text-[13px] font-semibold text-[#374151] mb-3">Select transition:</p>
              <div className="flex flex-col gap-2">
                {transiciones.map((t) => {
                  const tgt = STATUS_COLORS[t.hacia] || { bg: 'bg-[#f3f4f6]', text: 'text-[#6b7280]', border: 'border-[#e5e7eb]' }
                  const isSelected = transicionSeleccionada?.hacia === t.hacia
                  return (
                    <button
                      key={t.hacia}
                      onClick={() => handleSelect(t)}
                      className={[
                        'flex items-center gap-3 px-4 py-3 rounded-md border text-left w-full transition-all cursor-pointer',
                        isSelected ? 'border-[#3b82f6] bg-[#eff6ff]' : 'border-[#e5e7eb] bg-white hover:bg-[#f9fafb]',
                      ].join(' ')}
                    >
                      <span className="text-xs font-semibold text-[#6b7280] px-2 py-0.5 rounded bg-[#f3f4f6]">{t.desde}</span>
                      <span className="text-xs text-[#9ca3af]">&#8594;</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${tgt.bg} ${tgt.text}`}>{t.hacia}</span>
                      <span className="text-xs text-[#9ca3af] ml-auto">{t.label}</span>
                      {t.requiereObservacion && (
                        <span className="text-[10px] text-[#f59e0b] bg-[#fffbeb] px-1.5 py-0.5 rounded border border-[#fde68a]">req: observacion</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {paso === 2 && transicionSeleccionada && targetSt && (
            <>
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-md border border-[#a7f3d0] bg-[#ecfdf5] mb-4">
                <span className="w-5 h-5 rounded-full bg-[#10b981] text-white flex items-center justify-center text-xs shrink-0">&#10003;</span>
                <div>
                  <div className="text-[13px] font-semibold text-[#065f46]">Confirm transition</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[11px] font-bold px-1.5 py-[1px] rounded ${currentSt.bg} ${currentSt.text}`}>{transicionSeleccionada.desde}</span>
                    <span className="text-[11px] text-[#9ca3af]">&#8594;</span>
                    <span className={`text-[11px] font-bold px-1.5 py-[1px] rounded ${targetSt.bg} ${targetSt.text}`}>{transicionSeleccionada.hacia}</span>
                  </div>
                </div>
              </div>

              {transicionSeleccionada.requiereObservacion && (
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[13px] text-[#f59e0b]">&#9888;</span>
                    <span className="text-[13px] font-semibold text-[#374151]">Observation (required)</span>
                  </div>
                  <textarea
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                    placeholder="Enter observation for this transition..."
                    className="w-full min-h-[80px] p-2.5 rounded-md border border-[#fde68a] bg-[#fffbeb] text-[13px] resize-y outline-none focus:border-[#f59e0b]"
                  />
                  <p className="text-xs text-[#f59e0b] mt-1.5">
                    Required for {transicionSeleccionada.desde} &#8594; {transicionSeleccionada.hacia}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e5e7eb] flex justify-end gap-2.5">
          {paso === 1 && (
            <>
              <button onClick={onClose} className="px-4 py-2 rounded-md border border-[#e5e7eb] bg-white text-[#374151] text-[13px] font-medium hover:bg-[#f9fafb] transition-colors">Cancel</button>
              <button
                onClick={handleContinue}
                disabled={!transicionSeleccionada}
                className={`px-4 py-2 rounded-md border text-[13px] font-medium text-white transition-colors ${transicionSeleccionada ? 'border-[#111827] bg-[#111827] hover:bg-[#374151] cursor-pointer' : 'border-[#9ca3af] bg-[#9ca3af] cursor-not-allowed'}`}
              >
                Continue
              </button>
            </>
          )}
          {paso === 2 && (
            <>
              <button onClick={handleBack} className="px-4 py-2 rounded-md border border-[#e5e7eb] bg-white text-[#374151] text-[13px] font-medium hover:bg-[#f9fafb] transition-colors">Back</button>
              <button
                onClick={handleConfirm}
                disabled={loading || (transicionSeleccionada?.requiereObservacion && !observacion.trim())}
                className={`px-4 py-2 rounded-md border text-[13px] font-medium text-white flex items-center gap-1.5 transition-colors ${
                  loading || (transicionSeleccionada?.requiereObservacion && !observacion.trim())
                    ? 'border-[#9ca3af] bg-[#9ca3af] cursor-not-allowed'
                    : 'border-[#111827] bg-[#111827] hover:bg-[#374151] cursor-pointer'
                }`}
              >
                {loading && <span>&#8635;</span>}
                &#128274; Confirm
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
