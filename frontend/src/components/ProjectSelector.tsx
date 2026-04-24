import { useState, useRef, useEffect } from 'react'
import { useProyectos } from '../hooks/useProyectos'
import type { Proyecto } from '../types'

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
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (id: number) => {
    onChange(id)
    setAbierto(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setAbierto(!abierto)}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 14px',
          borderRadius: 6,
          border: '1px solid #d1d5db',
          background: '#fff',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 14,
          color: '#374151',
          minWidth: 180,
        }}
      >
        <span style={{ fontSize: 13, color: '#6b7280' }}>Project:</span>
        <span style={{ fontWeight: 500 }}>{proyectoActual?.nombre || 'Select...'}</span>
        <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 'auto' }}>&#9662;</span>
      </button>

      {abierto && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            zIndex: 100,
            maxHeight: 200,
            overflow: 'auto',
          }}
        >
          {proyectos.map((p: Proyecto) => (
            <button
              key={p.id}
              onClick={() => handleSelect(p.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '8px 14px',
                border: 'none',
                borderBottom: '1px solid #f3f4f6',
                background: p.id === value ? '#f3f4f6' : '#fff',
                cursor: 'pointer',
                fontSize: 13,
                color: p.id === value ? '#111827' : '#6b7280',
                textAlign: 'left',
              }}
            >
              <span style={{ fontWeight: p.id === value ? 600 : 400 }}>{p.nombre}</span>
              <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>
                {p.acronimo}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
