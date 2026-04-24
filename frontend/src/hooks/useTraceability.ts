import { useState, useEffect, useCallback } from 'react'
import { obtenerReporteDocumentos } from '../api'
import type { ReporteDocumentos } from '../types'

export function useTraceability(proyectoId?: number) {
  const [reporte, setReporte] = useState<ReporteDocumentos | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    if (!proyectoId) return
    setLoading(true)
    setError(null)
    try {
      const data = await obtenerReporteDocumentos(proyectoId)
      setReporte(data)
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }, [proyectoId])

  useEffect(() => {
    cargar()
  }, [cargar])

  // Calcular approved/pending REAL por modulo usando por_modulo_estado
  const porModulo = reporte
    ? reporte.por_modulo.map((m) => {
        const aprobados = reporte.por_modulo_estado
          .filter((me) => me.modulo === m.modulo && me.estado === 'APB')
          .reduce((sum, me) => sum + me.count, 0)
        return {
          modulo: m.modulo,
          total: m.count,
          aprobados,
          pendientes: m.count - aprobados,
        }
      })
    : []

  // Global progress
  const globalProgress = reporte
    ? Math.round(
        ((reporte.por_estado.find((e) => e.estado === 'APB')?.count || 0) / reporte.total) * 100
      )
    : 0

  return { reporte, porModulo, globalProgress, loading, error, recargar: cargar }
}