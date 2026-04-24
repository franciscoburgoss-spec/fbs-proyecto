import { useState, useRef, useEffect } from 'react'
import { useProyectos } from '../hooks/useProyectos'
import type { Proyecto } from '../types'
import { ChevronDown } from 'lucide-react'

interface ProjectSelectorProps {
  value: number
  onChange: (id: number) => void
}

export default function ProjectSelector({ value, onChange }: ProjectSelectorProps) {
  const { proyectos, loading } = useProyectos()
  const [abierto, setAbierto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const proyectoActual = proyectos.find((p) => p.id === value)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (id: number) => { onChange(id); setAbierto(false) }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAbierto(!abierto)}
        disabled={loading}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-md border border-[#d1d5db] bg-white text-sm text-[#374151] min-w-[180px] hover:border-[#9ca3af] transition-colors disabled:cursor-not-allowed"
      >
        <span className="text-[13px] text-[#6b7280]">Project:</span>
        <span className="font-medium">{proyectoActual?.nombre || 'Select...'}</span>
        <ChevronDown className="w-3 h-3 text-[#9ca3af] ml-auto shrink-0" strokeWidth={2} />
      </button>

      {abierto && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-[#e5e7eb] rounded-md shadow-lg z-[100] max-h-[200px] overflow-auto">
          {proyectos.map((p: Proyecto) => (
            <button
              key={p.id}
              onClick={() => handleSelect(p.id)}
              className={`flex items-center gap-2 w-full px-3.5 py-2 border-b border-[#f3f4f6] text-left text-[13px] cursor-pointer transition-colors ${
                p.id === value ? 'bg-[#f3f4f6] text-[#111827] font-semibold' : 'bg-white text-[#6b7280] hover:bg-[#f9fafb]'
              }`}
            >
              <span>{p.nombre}</span>
              <span className="text-[11px] text-[#9ca3af] ml-auto">{p.acronimo}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
