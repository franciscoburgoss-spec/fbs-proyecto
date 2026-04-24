import { useState } from 'react'
import type { Documento } from '../types'

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
        overflow: 'auto',
        background: '#fff',
        borderRadius: 8,
        border: '1px solid #e5e7eb',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
            {['DOCUMENT ID', 'TITLE', 'MODULE', 'STATUS', 'LAST UPDATE', 'ACTIONS'].map(
              (h) => (
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
              )
            )}
          </tr>
        </thead>
        <tbody>
          {documentos.map((doc) => {
            const status =
              STATUS_COLORS[doc.estado] || {
                bg: '#f3f4f6',
                text: '#6b7280',
                border: '#e5e7eb',
              }
            const mod =
              MODULE_COLORS[doc.modulo] || { bg: '#f3f4f6', text: '#6b7280' }
            const fecha = new Date(doc.fecha_modificacion).toLocaleDateString(
              'en-US',
              {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }
            )
            const docId = formatDocumentId(doc)
            const isExpanded = expandedIds.has(doc.id)

            return (
              <tr
                key={doc.id}
                style={{ borderBottom: '1px solid #f3f4f6' }}
              >
                {/* Document ID: chevron + name + sub-id */}
                <td style={{ padding: '14px 16px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                    }}
                  >
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
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: '#111827',
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
                        }}
                      >
                        {docId}
                      </div>
                      {/* Expanded detail */}
                      {isExpanded && (
                        <div
                          style={{
                            marginTop: 8,
                            padding: '8px 12px',
                            background: '#f9fafb',
                            borderRadius: 6,
                            fontSize: 12,
                            color: '#6b7280',
                            maxWidth: 300,
                          }}
                        >
                          <div>
                            <strong>Module:</strong> {doc.modulo}
                          </div>
                          <div>
                            <strong>Stage:</strong> {doc.etapa}
                          </div>
                          <div>
                            <strong>Type:</strong> {doc.tipo}
                          </div>
                          <div>
                            <strong>Status:</strong> {doc.estado}
                          </div>
                          {doc.observacion && (
                            <div style={{ marginTop: 4, color: '#991b1b' }}>
                              <strong>Observation:</strong>{' '}
                              {doc.observacion}
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
                    padding: '14px 16px',
                    color: '#374151',
                    fontSize: 14,
                  }}
                >
                  {doc.nombre}
                </td>

                {/* Module pill */}
                <td style={{ padding: '14px 16px' }}>
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
                <td style={{ padding: '14px 16px' }}>
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
                    {doc.estado === 'APB' && <span>&#10003;</span>}
                    {doc.estado === 'OBS' && <span>!</span>}
                    {doc.estado === 'COR' && <span>&#8635;</span>}
                    {doc.estado === 'ING' && <span>&#9679;</span>}
                    {doc.estado}
                  </span>
                </td>

                {/* Last Update */}
                <td
                  style={{
                    padding: '14px 16px',
                    color: '#6b7280',
                    fontSize: 13,
                  }}
                >
                  {fecha}
                </td>

                {/* Actions */}
                <td style={{ padding: '14px 16px' }}>
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
