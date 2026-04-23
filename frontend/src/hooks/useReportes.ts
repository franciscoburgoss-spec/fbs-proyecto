import { useState, useCallback } from 'react'
import { obtenerReporteGeneral, obtenerReporteProyectos, obtenerReporteDocumentos } from '../api'
import type { ReporteGeneral, ReporteProyectos, ReporteDocumentos } from '../types'

export function useReportes() {
  const [general, setGeneral] = useState<ReporteGeneral | null>(null)
  const [proyectos, setProyectos] = useState<ReporteProyectos | null>(null)
  const [documentos, setDocumentos] = useState<ReporteDocumentos | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargarGeneral = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await obtenerReporteGeneral()
      setGeneral(data)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al cargar reporte')
    } finally {
      setLoading(false)
    }
  }, [])

  const cargarProyectos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await obtenerReporteProyectos()
      setProyectos(data)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al cargar reporte de proyectos')
    } finally {
      setLoading(false)
    }
  }, [])

  const cargarDocumentos = useCallback(async (proyecto_id?: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await obtenerReporteDocumentos(proyecto_id)
      setDocumentos(data)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al cargar reporte de documentos')
    } finally {
      setLoading(false)
    }
  }, [])

  return { general, proyectos, documentos, loading, error, cargarGeneral, cargarProyectos, cargarDocumentos }
}
