import type { Documento } from '../types'

interface DocumentTableProps {
  documentos: Documento[]
  onTransicionar?: (doc: Documento) => void
  onObservacion?: (doc: Documento) => void
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  APB: { bg: '#d1fae5', text: '#065f46' },
  ING: { bg: '#dbeafe', text: '#1e40af' },
  COR: { bg: '#fef3c7', text: '#92400e' },
  OBS: { bg: '#fee2e2', text: '#991b1b' },
}

const STATUS_LABELS: Record<string, string> = {
  APB: 'APB',
  ING: 'ING',
  COR: 'COR',
  OBS: 'OBS',
}

export function formatDocumentId(doc: Documento): string {
  return `${doc.modulo}-${doc.etapa}-${doc.tipo}-${doc.tt}-${doc.nn}`
}

export default function DocumentTable({ documentos, onTransicionar, onObservacion }: DocumentTableProps) {
  if (documentos.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', border: '1px dashed #e5e7eb', borderRadius: 8 }}>
        No hay documentos para mostrar.
      </div>
    )
  }

  return (
    <div style={{ overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 13 }}>Document ID</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 13 }}>Title</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 13 }}>Module</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 13 }}>Status</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 13 }}>Last Update</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 13 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {documentos.map((doc) => {
            const statusColor = STATUS_COLORS[doc.estado] || { bg: '#f3f4f6', text: '#6b7280' }
            const fecha = new Date(doc.fecha_modificacion).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })

            return (
              <tr key={doc.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: 13, color: '#4b5563' }}>
                  {formatDocumentId(doc)}
                </td>
                <td style={{ padding: '12px', color: '#111827', fontWeight: 500 }}>{doc.nombre}</td>
                <td style={{ padding: '12px', color: '#6b7280' }}>{doc.modulo}</td>
                <td style={{ padding: '12px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      background: statusColor.bg,
                      color: statusColor.text,
                    }}
                  >
                    {STATUS_LABELS[doc.estado] || doc.estado}
                  </span>
                </td>
                <td style={{ padding: '12px', color: '#6b7280', fontSize: 13 }}>{fecha}</td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {doc.estado !== 'APB' && onTransicionar && (
                      <button
                        onClick={() => onTransicionar(doc)}
                        style={{
                          padding: '4px 10px',
                          fontSize: 12,
                          border: '1px solid #d1d5db',
                          borderRadius: 4,
                          background: '#fff',
                          cursor: 'pointer',
                          color: '#374151',
                        }}
                        title="Transicionar estado"
                      >
                        ▶
                      </button>
                    )}
                    {doc.observacion && onObservacion && (
                      <button
                        onClick={() => onObservacion(doc)}
                        style={{
                          padding: '4px 10px',
                          fontSize: 12,
                          border: '1px solid #f59e0b',
                          borderRadius: 4,
                          background: '#fffbeb',
                          cursor: 'pointer',
                          color: '#92400e',
                        }}
                        title={doc.observacion}
                      >
                        !
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
