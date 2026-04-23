import { useState, useCallback } from 'react'
import { obtenerProyectoDetalle, listarEventosPorProyecto } from '../api'
import type { ProyectoDetalle, Evento } from '../types'

export function useProyectoDetail() {
  const [detalle, setDetalle] = useState<ProyectoDetalle | null>(null)
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargarDetalle = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await obtenerProyectoDetalle(id)
      setDetalle(data)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al cargar detalle del proyecto')
    } finally {
      setLoading(false)
    }
  }, [])

  const cargarEventos = useCallback(async (proyecto_id: number) => {
    try {
      const data = await listarEventosPorProyecto(proyecto_id)
      setEventos(data)
    } catch (e: any) {
      // Silencioso: los eventos son opcionales (requieren admin)
      setEventos([])
    }
  }, [])

  return { detalle, eventos, loading, error, cargarDetalle, cargarEventos }
}
