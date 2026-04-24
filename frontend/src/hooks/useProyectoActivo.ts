import { useState } from 'react'

export function useProyectoActivo() {
  const [proyectoActivoId, setProyectoActivoId] = useState<number>(() => {
    const stored = localStorage.getItem('fbs_proyecto_activo')
    return stored ? parseInt(stored, 10) : 1
  })

  const cambiarProyecto = (id: number) => {
    localStorage.setItem('fbs_proyecto_activo', String(id))
    setProyectoActivoId(id)
  }

  return { proyectoActivoId, cambiarProyecto }
}
