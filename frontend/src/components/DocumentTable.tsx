import { useState } from 'react'
import type { Documento } from '../types'
import { getAvailableTransitions } from './TransitionModal'
import { ChevronRight, Lock, MoreHorizontal, CircleCheck, Circle, RefreshCw, Ban } from 'lucide-react'

interface DocumentTableProps {
  documentos: Documento[]
  onAction?: (doc: Documento) => void
}

const STATUS_META: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  APB: {
    bg: 'bg-[#f0fdf4]',
    text: 'text-[#16a34a]',
    border: 'border-[#bbf7d0]',
    icon: <CircleCheck className="w-3 h-3" strokeWidth={2} />,
  },
  ING: {
    bg: 'bg-[#eff6ff]',
    text: 'text-[#3b82f6]',
    border: 'border-[#bfdbfe]',
    icon: <Circle className="w-3 h-3" strokeWidth={2} />,
  },
  COR: {
    bg: 'bg-[#fffbeb]',
    text: 'text-[#f59e0b]',
    border: 'border-[#fde68a]',
    icon: <RefreshCw className="w-3 h-3" strokeWidth={2} />,
  },
  OBS: {
    bg: 'bg-[#fef2f2]',
    text: 'text-[#ef4444]',
    border: 'border-[#fecaca]',
    icon: <Ban className="w-3 h-3" strokeWidth={2} />,
  },
}

const MODULE_META: Record<string, { bg: string; text: string }> = {
  EST: { bg: 'bg-[#eff6ff]', text: 'text-[#2563eb]' },
  HAB: { bg: 'bg-[#f0fdf4]', text: 'text-[#16a34a]' },
  MDS: { bg: 'bg-[#fffbeb]', text: 'text-[#d97706]' },
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
      {/* Header */}
      <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-[#e5e7eb]">
        <div className="col-span-3 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-[0.5px]">Document ID</div>
        <div className="col-span-3 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-[0.5px]">Title</div>
        <div className="col-span-2 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-[0.5px]">Module</div>
        <div className="col-span-2 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-[0.5px]">Status</div>
        <div className="col-span-1 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-[0.5px]">Last Update</div>
        <div className="col-span-1 text-[11px] font-semibold text-[#9ca3af] uppercase tracking-[0.5px] text-right">Actions</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#f3f4f6]">
        {documentos.map((doc) => {
          const st = STATUS_META[doc.estado] || {
            bg: 'bg-[#f3f4f6]',
            text: 'text-[#6b7280]',
            border: 'border-[#e5e7eb]',
            icon: null,
          }
          const mod = MODULE_META[doc.modulo] || { bg: 'bg-[#f3f4f6]', text: 'text-[#6b7280]' }
          const fecha = formatFecha(doc.fecha_modificacion)
          const docId = formatDocumentId(doc)
          const isExpanded = expandedIds.has(doc.id)
          const transiciones = getAvailableTransitions(doc.estado)

          return (
            <div key={doc.id}>
              {/* Row */}
              <div
                className="grid grid-cols-12 gap-3 px-4 py-3 items-center cursor-pointer hover:bg-[#fafafa] transition-colors"
                onClick={() => toggleExpand(doc.id)}
              >
                {/* Document ID */}
                <div className="col-span-3 flex items-center gap-2">
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-[#9ca3af] shrink-0 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
                    strokeWidth={2}
                  />
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-[#374151] leading-5">{doc.nombre}</div>
                    <div className="text-[11px] text-[#9ca3af] font-mono leading-4">{docId}</div>
                  </div>
                </div>

                {/* Title */}
                <div className="col-span-3 text-[13px] text-[#4b5563] leading-5">{doc.nombre}</div>

                {/* Module */}
                <div className="col-span-2">
                  <span className={`inline-flex items-center justify-center rounded-full text-[11px] font-medium px-2 py-0.5 ${mod.bg} ${mod.text}`}>
                    {doc.modulo}
                  </span>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${st.bg} ${st.text} ${st.border}`}>
                    {st.icon}
                    {doc.estado}
                  </span>
                </div>

                {/* Last Update */}
                <div className="col-span-1 text-[12px] text-[#9ca3af] leading-5">{fecha}</div>

                {/* Actions */}
                <div className="col-span-1 text-right">
                  {doc.estado === 'APB' ? (
                    <button
                      disabled
                      className="p-1.5 rounded-md hover:bg-[#f3f4f6] transition-colors inline-flex items-center gap-1 text-[11px] text-[#6b7280]"
                    >
                      <Lock className="w-3.5 h-3.5 text-[#9ca3af]" strokeWidth={2} />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); onAction && onAction(doc) }}
                      className="p-1.5 rounded-md hover:bg-[#f3f4f6] transition-colors inline-flex items-center gap-1 text-[11px] text-[#6b7280]"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5 text-[#9ca3af]" strokeWidth={2} />
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-3 pl-[52px]">
                  {/* Transition History */}
                  <div className="mb-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <RefreshCw className="w-3 h-3 text-[#9ca3af]" strokeWidth={2} />
                      <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-[0.5px]">Transition History</span>
                    </div>
                    <p className="text-xs text-[#d1d5db] italic pl-4">No transitions recorded</p>
                  </div>

                  {/* Available Transitions */}
                  {transiciones.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-[11px] text-[#9ca3af]">&#8594;</span>
                        <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-[0.5px]">Available Transitions</span>
                      </div>
                      <div className="flex gap-2 pl-4 flex-wrap">
                        {transiciones.map((t) => {
                          const tgt = STATUS_META[t.hacia] || { bg: 'bg-[#f3f4f6]', text: 'text-[#6b7280]', border: 'border-[#e5e7eb]' }
                          return (
                            <button
                              key={t.hacia}
                              onClick={(e) => { e.stopPropagation(); onAction && onAction(doc) }}
                              className={`flex items-center gap-1 px-2 py-[3px] rounded text-[11px] font-semibold border cursor-pointer hover:opacity-80 transition-opacity leading-4 ${tgt.bg} ${tgt.text} ${tgt.border}`}
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
          )
        })}
      </div>
    </div>
  )
}
