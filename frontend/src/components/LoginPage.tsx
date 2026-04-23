import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { login, register, error, clearError, loading } = useAuth()
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    try {
      if (isRegister) {
        await register({ username: form.username, email: form.email, password: form.password })
      } else {
        await login({ username: form.username, password: form.password })
      }
      navigate('/')
    } catch {
      // Error ya esta en el contexto
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ width: 360, padding: 32, border: '1px solid #ddd', borderRadius: 12 }}>
        <h1 style={{ margin: '0 0 24px', textAlign: 'center' }}>FBS</h1>
        <h2 style={{ margin: '0 0 16px', textAlign: 'center', fontSize: 18, color: '#666' }}>
          {isRegister ? 'Crear Cuenta' : 'Iniciar Sesion'}
        </h2>

        {error && <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 12, textAlign: 'center' }}>{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            placeholder="Usuario"
            value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            required
            style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #ccc' }}
          />
          {isRegister && (
            <input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #ccc' }}
            />
          )}
          <input
            placeholder="Contraseña"
            type="password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required
            style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #ccc' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '10px', borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Cargando...' : isRegister ? 'Registrarse' : 'Entrar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#666' }}>
          {isRegister ? 'Ya tienes cuenta?' : 'No tienes cuenta?'}{' '}
          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); clearError() }}
            style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isRegister ? 'Inicia sesion' : 'Registrate'}
          </button>
        </p>

        <p style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: '#999' }}>
          Admin por defecto: admin / admin123
        </p>
      </div>
    </div>
  )
}
