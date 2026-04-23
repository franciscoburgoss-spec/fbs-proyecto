import { useState, useCallback } from 'react'
import { listarUsuarios, cambiarRol, toggleActivo } from '../api'
import type { Usuario } from '../types'

export function useAdmin() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listarUsuarios()
      setUsuarios(data)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }, [])

  const cambiarRolUsuario = useCallback(async (id: number, rol: 'admin' | 'user') => {
    setError(null)
    try {
      const actualizado = await cambiarRol(id, rol)
      setUsuarios(prev => prev.map(u => u.id === id ? actualizado : u))
      return actualizado
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al cambiar rol')
      throw e
    }
  }, [])

  const toggleUsuarioActivo = useCallback(async (id: number) => {
    setError(null)
    try {
      const actualizado = await toggleActivo(id)
      setUsuarios(prev => prev.map(u => u.id === id ? actualizado : u))
      return actualizado
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al cambiar estado')
      throw e
    }
  }, [])

  return { usuarios, loading, error, cargar, cambiarRolUsuario, toggleUsuarioActivo }
}
