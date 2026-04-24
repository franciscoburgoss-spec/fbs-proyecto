import { useState } from 'react'
import type { Documento } from '../types'
import { getAvailableTransitions } from './TransitionModal'

interface DocumentTableProps {
  documentos: Documento[]
  onAction?: (doc: Documento) => void
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  APB: { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
  ING: { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' },
  COR: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
  OBS: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
}

const MODULE_COLORS: Record<string, { bg: string; text: string }> = {
  EST: { bg: '#fee2e2', text: '#991b1b' },
  HAB: { bg: '#d1fae5', text: '#065f46' },
  MDS: { bg: '#dbeafe', text: '#1e40af' },
}

export function formatDocumentId(doc: Documento): string {
  return `${doc.modulo}-${doc.etapa}-${doc.tipo}-${doc.tt}-${doc.nn}`
}

function formatFecha(fechaStr: string): string {
  const fecha = new Date(fechaStr)
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${fecha.getDate()} ${meses[fecha.getMonth()]} ${fecha.getFullYear()}`
}

function StatusIcon({ estado }: { estado: string }) {
  const icons: Record<string, string> = {
    APB: '&#10003;',
    ING: '&#9711;',
    COR: '&#8635;',
    OBS: '&#8856;',
  }
  return <span dangerouslySetInnerHTML={{ __html: icons[estado] || '' }} />
}

export default function DocumentTable({ documentos, onAction }: DocumentTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (documentos.length === 0) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          color: '#9ca3af',
          border: '1px dashed #e5e7eb',
          borderRadius: 8,
          background: '#fff',
        }}
      >
        No documents found for this project.
      </div>
    )
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 8,
        border: '1px solid #e5e7eb',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
            {['DOCUMENT ID', 'TITLE', 'MODULE', 'STATUS', 'LAST UPDATE', 'ACTIONS'].map((h) => (
              <th
                key={h}
                style={{
                  padding: '14px 16px',
                  textAlign: 'left',
                  fontWeight: 600,
                  color: '#9ca3af',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {documentos.map((doc) => {
            const status =
              STATUS_COLORS[doc.estado] || { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' }
            const mod = MODULE_COLORS[doc.modulo] || { bg: '#f3f4f6', text: '#6b7280' }
            const fecha = formatFecha(doc.fecha_modificacion)
            const docId = formatDocumentId(doc)
            const isExpanded = expandedIds.has(doc.id)
            const transiciones = getAvailableTransitions(doc.estado)

            return (
              <tr key={doc.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                {/* Document ID */}
                <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span
                      onClick={() => toggleExpand(doc.id)}
                      style={{
                        fontSize: 10,
                        color: '#9ca3af',
                        marginTop: 3,
                        cursor: 'pointer',
                        display: 'inline-block',
                        transition: 'transform 0.15s',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        userSelect: 'none',
                      }}
                    >
                      &#9656;
                    </span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                        {doc.nombre}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#9ca3af',
                          fontFamily: 'monospace',
                          marginTop: 2,
                        }}
                      >
                        {docId}
                      </div>
                    </div>
                  </div>

                  {/* EXPANDED: Transition History + Available Transitions */}
                  {isExpanded && (
                    <div style={{ marginTop: 12, marginLeft: 20 }}>
                      {/* Transition History */}
                      <div style={{ marginBottom: 12 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: 6,
                          }}
                        >
                          <span style={{ fontSize: 12, color: '#9ca3af' }}>&#8635;</span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: '#9ca3af',
                              textTransform: 'uppercase',
                              letterSpacing: 0.5,
                            }}
                          >
                            Transition History
                          </span>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 12,
                            color: '#d1d5db',
                            fontStyle: 'italic',
                            paddingLeft: 18,
                          }}
                        >
                          No transitions recorded
                        </p>
                      </div>

                      {/* Available Transitions */}
                      {transiciones.length > 0 && (
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              marginBottom: 8,
                            }}
                          >
                            <span style={{ fontSize: 12, color: '#9ca3af' }}>&#8594;</span>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: '#9ca3af',
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                              }}
                            >
                              Available Transitions
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 8, paddingLeft: 18 }}>
                            {transiciones.map((t) => {
                              const target =
                                STATUS_COLORS[t.hacia] || {
                                  bg: '#f3f4f6',
                                  text: '#6b7280',
                                  border: '#e5e7eb',
                                }
                              return (
                                <button
                                  key={t.hacia}
                                  onClick={() => onAction && onAction(doc)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '4px 10px',
                                    borderRadius: 4,
                                    border: `1px solid ${target.border}`,
                                    background: target.bg,
                                    color: target.text,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {t.desde} &#8594; {t.hacia}
                                  {t.requiereObservacion && (
                                    <span style={{ fontSize: 9, color: '#f59e0b', marginLeft: 4 }}>
                                      (needs observacion)
                                    </span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </td>

                {/* Title */}
                <td
                  style={{
                    padding: '14px 16px',
                    color: '#374151',
                    fontSize: 14,
                    verticalAlign: 'top',
                  }}
                >
                  {doc.nombre}
                </td>

                {/* Module pill */}
                <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      background: mod.bg,
                      color: mod.text,
                      textTransform: 'uppercase',
                    }}
                  >
                    {doc.modulo}
                  </span>
                </td>

                {/* Status pill */}
                <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 12px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      background: status.bg,
                      color: status.text,
                      border: `1px solid ${status.border}`,
                    }}
                  >
                    <StatusIcon estado={doc.estado} />
                    {doc.estado}
                  </span>
                </td>

                {/* Last Update */}
                <td
                  style={{
                    padding: '14px 16px',
                    color: '#6b7280',
                    fontSize: 13,
                    verticalAlign: 'top',
                  }}
                >
                  {fecha}
                </td>

                {/* Actions */}
                <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                  {doc.estado === 'APB' ? (
                    <span
                      style={{
                        fontSize: 16,
                        color: '#9ca3af',
                        cursor: 'default',
                      }}
                      title="Aprobado"
                    >
                      &#128274;
                    </span>
                  ) : (
                    <button
                      onClick={() => onAction && onAction(doc)}
                      style={{
                        padding: '4px 8px',
                        fontSize: 16,
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: '#6b7280',
                        borderRadius: 4,
                      }}
                      title="Acciones"
                    >
                      &#8942;
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
