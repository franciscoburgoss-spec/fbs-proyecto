import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { login as apiLogin, obtenerPerfil, register as apiRegister } from '../api'
import type { Usuario, LoginIn, RegisterIn, Token } from '../types'

interface AuthState {
  user: Usuario | null
  token: string | null
  loading: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  login: (data: LoginIn) => Promise<void>
  register: (data: RegisterIn) => Promise<void>
  logout: () => void
  clearError: () => void
}

export const AuthContext = createContext<AuthContextType>({
  user: null, token: null, loading: false, error: null,
  login: async () => {}, register: async () => {}, logout: () => {}, clearError: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('fbs_token'))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Al montar, si hay token guardado, validarlo cargando el perfil
  useEffect(() => {
    if (!token) return
    setLoading(true)
    obtenerPerfil()
      .then(setUser)
      .catch(() => {
        // Token invalido, limpiar
        localStorage.removeItem('fbs_token')
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  const login = useCallback(async (data: LoginIn) => {
    setLoading(true)
    setError(null)
    try {
      const tokenData: Token = await apiLogin(data)
      localStorage.setItem('fbs_token', tokenData.access_token)
      setToken(tokenData.access_token)
      // El useEffect se encargara de cargar el usuario
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error de login')
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (data: RegisterIn) => {
    setLoading(true)
    setError(null)
    try {
      await apiRegister(data)
      // Auto-login despues de registro
      await login({ username: data.username, password: data.password })
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error de registro')
      throw e
    } finally {
      setLoading(false)
    }
  }, [login])

  const logout = useCallback(() => {
    localStorage.removeItem('fbs_token')
    setToken(null)
    setUser(null)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}
