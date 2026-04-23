import { useState, useCallback } from 'react'
import { listarEventos, obtenerStatsEventos } from '../api'
import type { Evento } from '../types'

interface FiltrosEvento {
  event?: string
  usuario_id?: number
  desde?: string
  hasta?: string
}

export function useAuditoria() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [stats, setStats] = useState<{ total: number; por_tipo: { event: string; count: number }[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async (filtros: FiltrosEvento = {}, limit = 100, offset = 0) => {
    setLoading(true)
    setError(null)
    try {
      const [data, statsData] = await Promise.all([
        listarEventos({ ...filtros, limit, offset }),
        obtenerStatsEventos({ desde: filtros.desde, hasta: filtros.hasta }),
      ])
      setEventos(data)
      setStats(statsData)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al cargar eventos')
    } finally {
      setLoading(false)
    }
  }, [])

  return { eventos, stats, loading, error, cargar }
