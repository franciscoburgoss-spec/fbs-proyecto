import { useProyectos } from '../hooks/useProyectos'
import type { Proyecto } from '../types'

interface ProjectSelectorProps {
  value: number
  onChange: (id: number) => void
}

export default function ProjectSelector({ value, onChange }: ProjectSelectorProps) {
  const { proyectos, loading } = useProyectos()

  const proyectoActual = proyectos.find((p) => p.id === value)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 13, color: '#6b7280' }}>Project:</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={loading}
        style={{
          padding: '6px 12px',
          borderRadius: 6,
          border: '1px solid #d1d5db',
          fontSize: 14,
          background: '#fff',
          cursor: 'pointer',
          minWidth: 180,
        }}
      >
        {proyectos.map((p: Proyecto) => (
          <option key={p.id} value={p.id}>
            {p.nombre}
          </option>
        ))}
      </select>
      {proyectoActual && (
        <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>
          {proyectoActual.acronimo}
        </span>
      )}
    </div>
  )
}
