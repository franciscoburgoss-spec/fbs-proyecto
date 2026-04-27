import { useState, useEffect, useCallback } from 'react'
import { listarDocumentos, crearDocumento, actualizarDocumento, eliminarDocumento, transicionarDocumento } from '../api'
import type { Documento, DocumentoIn } from '../types'

export function useDocumentos(filtros?: { proyecto_id?: number; etapa?: string; estado?: string; modulo?: string }) {
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listarDocumentos(filtros)
      setDocumentos(data)
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }, [filtros])

  useEffect(() => { fetch() }, [fetch])

  const crear = async (proyecto_id: number, data: DocumentoIn) => {
    const nuevo = await crearDocumento(proyecto_id, data)
    setDocumentos(prev => [nuevo, ...prev])
    return nuevo
  }

  const actualizar = async (id: number, data: Partial<DocumentoIn>) => {
    const actualizado = await actualizarDocumento(id, data)
    setDocumentos(prev => prev.map(d => d.id === id ? actualizado : d))
    return actualizado
  }

  const eliminar = async (id: number) => {
    await eliminarDocumento(id)
    setDocumentos(prev => prev.filter(d => d.id !== id))
  }

  const transicionar = async (id: number, a: string, payload?: Record<string, unknown>) => {
    const actualizado = await transicionarDocumento(id, a, payload)
    setDocumentos(prev => prev.map(d => d.id === id ? actualizado : d))
    return actualizado
  }

  return { documentos, loading, error, fetch, crear, actualizar, eliminar, transicionar }
}
