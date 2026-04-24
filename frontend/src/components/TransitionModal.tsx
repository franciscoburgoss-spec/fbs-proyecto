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
  ING: [
    { desde: 'ING', hacia: 'OBS', label: 'estado_cambiado', requiereObservacion: true },
  ],
  OBS: [
    { desde: 'OBS', hacia: 'COR', label: 'doc_corregido', requiereObservacion: false },
  ],
  COR: [
    { desde: 'COR', hacia: 'APB', label: 'doc_aprobado', requiereObservacion: false },
    { desde: 'COR', hacia: 'OBS', label: 'estado_cambiado', requiereObservacion: true },
  ],
  APB: [],
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  APB: { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
  ING: { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' },
  COR: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
  OBS: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
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
  const currentStatus = STATUS_COLORS[doc.estado] || { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' }

  const handleSelect = (t: Transition) => {
    setTransicionSeleccionada(t)
  }

  const handleContinue = () => {
    if (!transicionSeleccionada) return
    setPaso(2)
    if (!transicionSeleccionada.requiereObservacion) {
      setObservacion('')
    }
  }

  const handleConfirm = async () => {
    if (!doc || !transicionSeleccionada) return
    if (transicionSeleccionada.requiereObservacion && !observacion.trim()) return

    setLoading(true)
    try {
      await onConfirm(
        doc.id,
        transicionSeleccionada.hacia,
        transicionSeleccionada.requiereObservacion ? observacion : undefined
      )
      onClose()
    } catch (e) {
      // Error manejado por el padre
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setPaso(1)
    setObservacion('')
  }

  const targetStatus = transicionSeleccionada
    ? STATUS_COLORS[transicionSeleccionada.hacia] || { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' }
    : null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          minWidth: 420,
          maxWidth: 480,
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>
              Transition Document
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>{doc.nombre}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 18,
              color: '#9ca3af',
              padding: 0,
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4,
            }}
          >
            &#10005;
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          {/* Current state */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: '#6b7280' }}>Current state:</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 10px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                background: currentStatus.bg,
                color: currentStatus.text,
                border: `1px solid ${currentStatus.border}`,
                textTransform: 'uppercase',
              }}
            >
              {doc.estado}
            </span>
          </div>

          {paso === 1 && (
            <>
              <p
                style={{
                  margin: '0 0 12px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#374151',
                }}
              >
                Select transition:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {transiciones.map((t) => {
                  const target = STATUS_COLORS[t.hacia] || { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' }
                  const isSelected = transicionSeleccionada?.hacia === t.hacia

                  return (
                    <button
                      key={t.hacia}
                      onClick={() => handleSelect(t)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 16px',
                        borderRadius: 6,
                        border: isSelected ? '1px solid #3b82f6' : '1px solid #e5e7eb',
                        background: isSelected ? '#eff6ff' : '#fff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'all 0.12s',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#6b7280',
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: '#f3f4f6',
                        }}
                      >
                        {t.desde}
                      </span>
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>&#8594;</span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: target.text,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: target.bg,
                        }}
                      >
                        {t.hacia}
                      </span>
                      <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 'auto' }}>
                        {t.label}
                      </span>
                      {t.requiereObservacion && (
                        <span
                          style={{
                            fontSize: 10,
                            color: '#f59e0b',
                            background: '#fffbeb',
                            padding: '2px 6px',
                            borderRadius: 4,
                            border: '1px solid #fde68a',
                          }}
                        >
                          req: observacion
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {paso === 2 && transicionSeleccionada && targetStatus && (
            <>
              {/* Confirm transition box */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  borderRadius: 6,
                  border: '1px solid #a7f3d0',
                  background: '#ecfdf5',
                  marginBottom: 16,
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: '#10b981',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                >
                  &#10003;
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#065f46' }}>
                    Confirm transition
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: currentStatus.text,
                        padding: '1px 6px',
                        borderRadius: 3,
                        background: currentStatus.bg,
                      }}
                    >
                      {transicionSeleccionada.desde}
                    </span>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>&#8594;</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: targetStatus.text,
                        padding: '1px 6px',
                        borderRadius: 3,
                        background: targetStatus.bg,
                      }}
                    >
                      {transicionSeleccionada.hacia}
                    </span>
                  </div>
                </div>
              </div>

              {/* Observation field (if required) */}
              {transicionSeleccionada.requiereObservacion && (
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: 13, color: '#f59e0b' }}>&#9888;</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                      Observation (required)
                    </span>
                  </div>
                  <textarea
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                    placeholder="Enter observation for this transition..."
                    style={{
                      width: '100%',
                      minHeight: 80,
                      padding: 10,
                      borderRadius: 6,
                      border: '1px solid #fde68a',
                      background: '#fffbeb',
                      fontFamily: 'inherit',
                      fontSize: 13,
                      resize: 'vertical',
                      outline: 'none',
                    }}
                  />
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: '#f59e0b' }}>
                    Required for {transicionSeleccionada.desde} &#8594; {transicionSeleccionada.hacia}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          {paso === 1 && (
            <>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#374151',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleContinue}
                disabled={!transicionSeleccionada}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid #111827',
                  background: transicionSeleccionada ? '#111827' : '#9ca3af',
                  color: '#fff',
                  cursor: transicionSeleccionada ? 'pointer' : 'not-allowed',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Continue
              </button>
            </>
          )}

          {paso === 2 && (
            <>
              <button
                onClick={handleBack}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#374151',
                }}
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={
                  loading ||
                  (transicionSeleccionada?.requiereObservacion && !observacion.trim())
                }
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid #111827',
                  background:
                    loading ||
                    (transicionSeleccionada?.requiereObservacion && !observacion.trim())
                      ? '#9ca3af'
                      : '#111827',
                  color: '#fff',
                  cursor:
                    loading ||
                    (transicionSeleccionada?.requiereObservacion && !observacion.trim())
                      ? 'not-allowed'
                      : 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
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
