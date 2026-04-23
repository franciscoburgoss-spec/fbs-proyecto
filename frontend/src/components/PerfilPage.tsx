import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { actualizarPerfil, cambiarPassword } from '../api'
import type { PerfilUpdate, PasswordChangeIn } from '../types'

export default function PerfilPage() {
  const { user } = useAuth()
  const [email, setEmail] = useState(user?.email || '')
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '' })
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleUpdatePerfil = async (e: React.FormEvent) => {
    e.preventDefault()
    setMensaje(null)
    setError(null)
    setLoading(true)
    try {
      await actualizarPerfil({ email } as PerfilUpdate)
      setMensaje('Perfil actualizado correctamente')
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al actualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMensaje(null)
    setError(null)
    setLoading(true)
    try {
      await cambiarPassword(passwordForm as PasswordChangeIn)
      setMensaje('Contraseña actualizada correctamente')
      setPasswordForm({ current_password: '', new_password: '' })
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al cambiar contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 500 }}>
      <h1 style={{ margin: '0 0 24px' }}>Mi Perfil</h1>

      {mensaje && <p style={{ color: '#166534', background: '#dcfce7', padding: '8px 12px', borderRadius: 6, marginBottom: 12 }}>{mensaje}</p>}
      {error && <p style={{ color: '#991b1b', background: '#fee2e2', padding: '8px 12px', borderRadius: 6, marginBottom: 12 }}>{error}</p>}

      <div style={{ marginBottom: 24, padding: 16, background: '#f9fafb', borderRadius: 8 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Informacion</h3>
        <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Usuario:</strong> {user?.username}</p>
        <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Rol:</strong> {user?.rol}</p>
        <p style={{ margin: '4px 0', fontSize: 14 }}><strong>Estado:</strong> {user?.activo ? 'Activo' : 'Inactivo'}</p>
      </div>

      <form onSubmit={handleUpdatePerfil} style={{ marginBottom: 32, padding: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Actualizar Email</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
            style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #ccc' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '10px', borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
          >
            Guardar email
          </button>
        </div>
      </form>

      <form onSubmit={handleChangePassword} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Cambiar Contraseña</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="password"
            value={passwordForm.current_password}
            onChange={e => setPasswordForm(f => ({ ...f, current_password: e.target.value }))}
            placeholder="Contraseña actual"
            required
            style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #ccc' }}
          />
          <input
            type="password"
            value={passwordForm.new_password}
            onChange={e => setPasswordForm(f => ({ ...f, new_password: e.target.value }))}
            placeholder="Nueva contraseña"
            required
            style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid #ccc' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '10px', borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
          >
            Cambiar contraseña
          </button>
        </div>
      </form>
    </div>
  )
}
