import { useState } from 'react'
import type { Documento } from '../types'
import { getAvailableTransitions } from './TransitionModal'

interface DocumentTableProps {
  documentos: Documento[]
  onAction?: (doc: Documento) => void
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  APB: { bg: 'bg-[#ecfdf5]', text: 'text-[#10b981]', border: 'border-[#a7f3d0]' },
  ING: { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]', border: 'border-[#bfdbfe]' },
  COR: { bg: 'bg-[#fffbeb]', text: 'text-[#f59e0b]', border: 'border-[#fde68a]' },
  OBS: { bg: 'bg-[#fef2f2]', text: 'text-[#ef4444]', border: 'border-[#fecaca]' },
}

const MODULE_COLORS: Record<string, { bg: string; text: string }> = {
  EST: { bg: 'bg-[#dbeafe]', text: 'text-[#3b82f6]' },
  HAB: { bg: 'bg-[#d1fae5]', text: 'text-[#10b981]' },
  MDS: { bg: 'bg-[#fef3c7]', text: 'text-[#f59e0b]' },
}

const STATUS_ICON: Record<string, string> = {
  APB: '&#10003;',
  ING: '&#9711;',
  COR: '&#8635;',
  OBS: '&#8856;',
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
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (documentos.length === 0) {
    return (
      <div className="p-10 text-center text-[#9ca3af] border border-dashed border-[#e5e7eb] rounded-lg bg-white text-sm">
        No documents found for this project.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-[#e5e7eb] overflow-hidden">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#e5e7eb]">
            {['DOCUMENT ID', 'TITLE', 'MODULE', 'STATUS', 'LAST UPDATE', 'ACTIONS'].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left font-semibold text-[11px] text-[#9ca3af] uppercase tracking-[0.5px]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {documentos.map((doc) => {
            const st = STATUS_COLORS[doc.estado] || { bg: 'bg-[#f3f4f6]', text: 'text-[#6b7280]', border: 'border-[#e5e7eb]' }
            const mod = MODULE_COLORS[doc.modulo] || { bg: 'bg-[#f3f4f6]', text: 'text-[#6b7280]' }
            const fecha = formatFecha(doc.fecha_modificacion)
            const docId = formatDocumentId(doc)
            const isExpanded = expandedIds.has(doc.id)
            const transiciones = getAvailableTransitions(doc.estado)

            return (
              <tr key={doc.id} className="border-b border-[#f3f4f6]">
                {/* Document ID */}
                <td className="px-4 py-3 align-top cursor-pointer" onClick={() => toggleExpand(doc.id)}>
                  <div className="flex items-start gap-2.5">
                    <span
                      className="text-[10px] text-[#9ca3af] mt-0.5 shrink-0 transition-transform duration-150 select-none"
                      style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                    >
                      &#9656;
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#111827] leading-5">{doc.nombre}</div>
                      <div className="text-xs text-[#9ca3af] font-mono mt-0.5 leading-4">{docId}</div>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="mt-3.5 ml-1">
                          {/* Transition History */}
                          <div className="mb-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="text-[11px] text-[#9ca3af]">&#8635;</span>
                              <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-[0.5px]">
                                Transition History
                              </span>
                            </div>
                            <p className="text-xs text-[#d1d5db] italic pl-4">No transitions recorded</p>
                          </div>

                          {/* Available Transitions */}
                          {transiciones.length > 0 && (
                            <div>
                              <div className="flex items-center gap-1.5 mb-2">
                                <span className="text-[11px] text-[#9ca3af]">&#8594;</span>
                                <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-[0.5px]">
                                  Available Transitions
                                </span>
                              </div>
                              <div className="flex gap-2 pl-4 flex-wrap">
                                {transiciones.map((t) => {
                                  const tgt = STATUS_COLORS[t.hacia] || { bg: 'bg-[#f3f4f6]', text: 'text-[#6b7280]', border: 'border-[#e5e7eb]' }
                                  return (
                                    <button
                                      key={t.hacia}
                                      onClick={(e) => { e.stopPropagation(); onAction && onAction(doc) }}
                                      className={`flex items-center gap-1 px-2 py-[3px] rounded text-[11px] font-semibold border ${tgt.bg} ${tgt.text} ${tgt.border} leading-4 cursor-pointer hover:opacity-80 transition-opacity`}
                                    >
                                      <span className="text-[10px] font-bold text-[#6b7280]">{t.desde}</span>
                                      <span className="text-[10px] text-[#9ca3af]">&#8594;</span>
                                      <span className="text-[10px] font-bold">{t.hacia}</span>
                                      {t.requiereObservacion && (
                                        <span className="text-[9px] text-[#9ca3af] ml-0.5">(needs observacion)</span>
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
                <td className="px-4 py-3 text-sm text-[#374151] align-top leading-5">{doc.nombre}</td>

                {/* Module */}
                <td className="px-4 py-3 align-top">
                  <span className={`inline-block px-2 py-[2px] rounded text-[11px] font-bold uppercase leading-[14px] ${mod.bg} ${mod.text}`}>
                    {doc.modulo}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3 align-top">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full text-xs font-semibold border ${st.bg} ${st.text} ${st.border} leading-4`}>
                    <span className="text-[11px] inline-flex items-center" dangerouslySetInnerHTML={{ __html: STATUS_ICON[doc.estado] || '' }} />
                    {doc.estado}
                  </span>
                </td>

                {/* Last Update */}
                <td className="px-4 py-3 text-[13px] text-[#6b7280] align-top leading-5">{fecha}</td>

                {/* Actions */}
                <td className="px-4 py-3 align-top">
                  {doc.estado === 'APB' ? (
                    <span className="text-sm text-[#d1d5db] cursor-default inline-block" title="Aprobado">&#128274;</span>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); onAction && onAction(doc) }}
                      className="px-1.5 py-0.5 text-sm text-[#9ca3af] hover:text-[#6b7280] transition-colors leading-none"
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
