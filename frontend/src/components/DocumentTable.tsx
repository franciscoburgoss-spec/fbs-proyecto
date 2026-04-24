import { useState } from 'react'
import type { Documento } from '../types'
import { getAvailableTransitions } from './TransitionModal'

interface DocumentTableProps {
  documentos: Documento[]
  onAction?: (doc: Documento) => void
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  APB: { bg: '#ecfdf5', text: '#10b981', border: '#a7f3d0', icon: '&#10003;' },
  ING: { bg: '#eff6ff', text: '#3b82f6', border: '#bfdbfe', icon: '&#9711;' },
  COR: { bg: '#fffbeb', text: '#f59e0b', border: '#fde68a', icon: '&#8635;' },
  OBS: { bg: '#fef2f2', text: '#ef4444', border: '#fecaca', icon: '&#8856;' },
}

const MODULE_COLORS: Record<string, { bg: string; text: string }> = {
  EST: { bg: '#dbeafe', text: '#3b82f6' },
  HAB: { bg: '#d1fae5', text: '#10b981' },
  MDS: { bg: '#fef3c7', text: '#f59e0b' },
}

export function formatDocumentId(doc: Documento): string {
  return `${doc.modulo}-${doc.etapa}-${doc.tipo}-${doc.tt}-${doc.nn}`
}

function formatFecha(fechaStr: string): string {
  const fecha = new Date(fechaStr)
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${fecha.getDate()} ${meses[fecha.getMonth()]} ${fecha.getFullYear()}`
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
          fontSize: 14,
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
        overflow: 'hidden',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, fontFamily: 'inherit' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
            {['DOCUMENT ID', 'TITLE', 'MODULE', 'STATUS', 'LAST UPDATE', 'ACTIONS'].map((h) => (
              <th
                key={h}
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: 600,
                  color: '#9ca3af',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontFamily: 'inherit',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {documentos.map((doc) => {
            const status = STATUS_COLORS[doc.estado] || {
              bg: '#f3f4f6',
              text: '#6b7280',
              border: '#e5e7eb',
              icon: '',
            }
            const mod = MODULE_COLORS[doc.modulo] || { bg: '#f3f4f6', text: '#6b7280' }
            const fecha = formatFecha(doc.fecha_modificacion)
            const docId = formatDocumentId(doc)
            const isExpanded = expandedIds.has(doc.id)
            const transiciones = getAvailableTransitions(doc.estado)

            return (
              <tr
                key={doc.id}
                style={{
                  borderBottom: '1px solid #f3f4f6',
                  transition: 'background 0.12s',
                }}
              >
                {/* Document ID: clickable area to expand */}
                <td
                  style={{ padding: '12px 16px', verticalAlign: 'top', cursor: 'pointer' }}
                  onClick={() => toggleExpand(doc.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span
                      style={{
                        fontSize: 10,
                        color: '#9ca3af',
                        marginTop: 3,
                        display: 'inline-block',
                        transition: 'transform 0.15s',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        userSelect: 'none',
                        flexShrink: 0,
                      }}
                    >
                      &#9656;
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: '#111827',
                          lineHeight: '20px',
                        }}
                      >
                        {doc.nombre}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#9ca3af',
                          fontFamily: 'monospace',
                          marginTop: 2,
                          lineHeight: '16px',
                        }}
                      >
                        {docId}
                      </div>

                      {/* EXPANDED: Transition History + Available Transitions */}
                      {isExpanded && (
                        <div style={{ marginTop: 14, marginLeft: 2 }}>
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
                              <span style={{ fontSize: 11, color: '#9ca3af' }}>&#8635;</span>
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
                                <span style={{ fontSize: 11, color: '#9ca3af' }}>&#8594;</span>
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
                              <div style={{ display: 'flex', gap: 8, paddingLeft: 18, flexWrap: 'wrap' }}>
                                {transiciones.map((t) => {
                                  const target =
                                    STATUS_COLORS[t.hacia] || {
                                      bg: '#f3f4f6',
                                      text: '#6b7280',
                                      border: '#e5e7eb',
                                      icon: '',
                                    }
                                  return (
                                    <button
                                      key={t.hacia}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onAction && onAction(doc)
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        padding: '3px 8px',
                                        borderRadius: 4,
                                        border: `1px solid ${target.border}`,
                                        background: target.bg,
                                        color: target.text,
                                        fontSize: 11,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        lineHeight: '16px',
                                      }}
                                    >
                                      <span style={{ fontSize: 10, fontWeight: 700, color: '#6b7280' }}>
                                        {t.desde}
                                      </span>
                                      <span style={{ fontSize: 10, color: '#9ca3af' }}>&#8594;</span>
                                      <span style={{ fontSize: 10, fontWeight: 700 }}>{t.hacia}</span>
                                      {t.requiereObservacion && (
                                        <span style={{ fontSize: 9, color: '#9ca3af', marginLeft: 2 }}>
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
                    </div>
                  </div>
                </td>

                {/* Title */}
                <td
                  style={{
                    padding: '12px 16px',
                    color: '#374151',
                    fontSize: 14,
                    verticalAlign: 'top',
                    lineHeight: '20px',
                  }}
                >
                  {doc.nombre}
                </td>

                {/* Module pill */}
                <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      background: mod.bg,
                      color: mod.text,
                      textTransform: 'uppercase',
                      lineHeight: '14px',
                    }}
                  >
                    {doc.modulo}
                  </span>
                </td>

                {/* Status pill */}
                <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 10px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      background: status.bg,
                      color: status.text,
                      border: `1px solid ${status.border}`,
                      lineHeight: '16px',
                    }}
                  >
                    <span
                      style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center' }}
                      dangerouslySetInnerHTML={{ __html: status.icon }}
                    />
                    {doc.estado}
                  </span>
                </td>

                {/* Last Update */}
                <td
                  style={{
                    padding: '12px 16px',
                    color: '#6b7280',
                    fontSize: 13,
                    verticalAlign: 'top',
                    lineHeight: '20px',
                  }}
                >
                  {fecha}
                </td>

                {/* Actions */}
                <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                  {doc.estado === 'APB' ? (
                    <span
                      style={{
                        fontSize: 14,
                        color: '#d1d5db',
                        cursor: 'default',
                        display: 'inline-block',
                      }}
                      title="Aprobado"
                    >
                      &#128274;
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onAction && onAction(doc)
                      }}
                      style={{
                        padding: '2px 6px',
                        fontSize: 14,
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: '#9ca3af',
                        borderRadius: 4,
                        lineHeight: 1,
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
