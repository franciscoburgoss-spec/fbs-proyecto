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

  // Calcular approved/pending por modulo
  const porModulo = reporte
    ? reporte.por_modulo.map((m) => {
        const aprobados = reporte.por_estado.find((e) => e.estado === 'APB')?.count || 0
        // Aproximacion: aprobados por modulo proporcional al total
        // Usamos los datos reales del reporte
        const totalModulo = m.count
        const moduloAprobados = Math.min(
          aprobados,
          totalModulo
        )
        return {
          modulo: m.modulo,
          total: totalModulo,
          aprobados: moduloAprobados,
          pendientes: totalModulo - moduloAprobados,
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
