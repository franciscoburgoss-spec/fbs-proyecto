import { useEffect } from 'react'
import { useAdmin } from '../hooks/useAdmin'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { usuarios, loading, error, cargar, cambiarRolUsuario, toggleUsuarioActivo } = useAdmin()

  // Redirigir si no es admin
  useEffect(() => {
    if (user && user.rol !== 'admin') {
      navigate('/')
    }
  }, [user, navigate])

  useEffect(() => {
    if (user?.rol === 'admin') {
      cargar()
    }
  }, [user, cargar])

  if (!user || user.rol !== 'admin') return null

  return (
    <div>
      <h1 style={{ margin: '0 0 24px' }}>Panel de Administracion</h1>

      {error && <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 12 }}>{error}</p>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Usuarios</h2>
        <button onClick={cargar} disabled={loading} style={{ padding: '6px 12px', cursor: 'pointer' }}>
          {loading ? 'Cargando...' : 'Refrescar'}
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
            <th style={{ padding: '10px 12px', borderBottom: '1px solid #ddd' }}>ID</th>
            <th style={{ padding: '10px 12px', borderBottom: '1px solid #ddd' }}>Usuario</th>
            <th style={{ padding: '10px 12px', borderBottom: '1px solid #ddd' }}>Email</th>
            <th style={{ padding: '10px 12px', borderBottom: '1px solid #ddd' }}>Rol</th>
            <th style={{ padding: '10px 12px', borderBottom: '1px solid #ddd' }}>Estado</th>
            <th style={{ padding: '10px 12px', borderBottom: '1px solid #ddd' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(u => (
            <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px 12px' }}>{u.id}</td>
              <td style={{ padding: '8px 12px' }}>{u.username}</td>
              <td style={{ padding: '8px 12px' }}>{u.email}</td>
              <td style={{ padding: '8px 12px' }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  background: u.rol === 'admin' ? '#dbeafe' : '#f3f4f6',
                  color: u.rol === 'admin' ? '#1e40af' : '#4b5563',
                }}>
                  {u.rol}
                </span>
              </td>
              <td style={{ padding: '8px 12px' }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  background: u.activo ? '#dcfce7' : '#fee2e2',
                  color: u.activo ? '#166534' : '#991b1b',
                }}>
                  {u.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td style={{ padding: '8px 12px' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => cambiarRolUsuario(u.id, u.rol === 'admin' ? 'user' : 'admin')}
                    style={{ padding: '4px 8px', fontSize: 12, cursor: 'pointer' }}
                  >
                    Cambiar rol
                  </button>
                  {u.id !== user.id && (
                    <button
                      onClick={() => toggleUsuarioActivo(u.id)}
                      style={{
                        padding: '4px 8px',
                        fontSize: 12,
                        cursor: 'pointer',
                        background: u.activo ? '#fee2e2' : '#dcfce7',
                        border: '1px solid #ccc',
                      }}
                    >
                      {u.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {usuarios.length === 0 && !loading && (
        <p style={{ textAlign: 'center', color: '#999', marginTop: 32 }}>No hay usuarios registrados.</p>
      )}
    </div>
  )
}
