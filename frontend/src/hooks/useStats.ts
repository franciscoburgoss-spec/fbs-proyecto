import { useState, useEffect } from 'react'
import { obtenerStats } from '../api'
import type { Stats } from '../types'

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    obtenerStats()
      .then(setStats)
      .catch((e: any) => setError(e.response?.data?.detail || e.message))
      .finally(() => setLoading(false))
  }, [])

  return { stats, loading, error }
}
