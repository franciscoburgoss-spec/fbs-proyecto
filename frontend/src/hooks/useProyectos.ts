import { useState, useEffect, useCallback } from 'react'
import { listarProyectos, crearProyecto, actualizarProyecto, eliminarProyecto, transicionarProyecto } from '../api'
import type { Proyecto, ProyectoIn } from '../types'

export function useProyectos() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listarProyectos()
      setProyectos(data)
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const crear = async (data: ProyectoIn) => {
    const nuevo = await crearProyecto(data)
    setProyectos(prev => [nuevo, ...prev])
    return nuevo
  }

  const actualizar = async (id: number, data: Partial<ProyectoIn>) => {
    const actualizado = await actualizarProyecto(id, data)
    setProyectos(prev => prev.map(p => p.id === id ? actualizado : p))
    return actualizado
  }

  const eliminar = async (id: number) => {
    await eliminarProyecto(id)
    setProyectos(prev => prev.filter(p => p.id !== id))
  }

  const transicionar = async (id: number, a: string) => {
    const actualizado = await transicionarProyecto(id, a)
    setProyectos(prev => prev.map(p => p.id === id ? actualizado : p))
    return actualizado
  }

  return { proyectos, loading, error, fetch, crear, actualizar, eliminar, transicionar }
}
