import { useState } from 'react'
import { useAdmin } from '../hooks/useAdmin'

export default function UsersRolesPage() {
  const { usuarios, loading, cambiarRolUsuario } = useAdmin()
  const [busqueda, setBusqueda] = useState('')

  const filtrados = usuarios.filter((u) =>
    u.username.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div>
      <h1 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 600, color: '#111827' }}>
        Users & Roles
      </h1>

      <input
        type="text"
        placeholder="Buscar usuario..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{
          padding: '8px 12px',
          borderRadius: 6,
          border: '1px solid #d1d5db',
          fontSize: 14,
          marginBottom: 16,
          width: 280,
        }}
      />

      {loading && <p style={{ color: '#6b7280' }}>Cargando usuarios...</p>}

      <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 13 }}>ID</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 13 }}>Username</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 13 }}>Email</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 13 }}>Role</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 13 }}>Status</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 13 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 12px', color: '#6b7280', fontSize: 13 }}>{u.id}</td>
                <td style={{ padding: '10px 12px', fontWeight: 500, color: '#111827' }}>{u.username}</td>
                <td style={{ padding: '10px 12px', color: '#6b7280' }}>{u.email}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      background: u.rol === 'admin' ? '#dbeafe' : '#f3f4f6',
                      color: u.rol === 'admin' ? '#1e40af' : '#6b7280',
                      textTransform: 'uppercase',
                    }}
                  >
                    {u.rol}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      background: u.activo ? '#d1fae5' : '#fee2e2',
                      color: u.activo ? '#065f46' : '#991b1b',
                    }}
                  >
                    {u.activo ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <button
                    onClick={() => cambiarRolUsuario(u.id, u.rol === 'admin' ? 'user' : 'admin')}
                    style={{
                      padding: '4px 10px',
                      fontSize: 12,
                      border: '1px solid #d1d5db',
                      borderRadius: 4,
                      background: '#fff',
                      cursor: 'pointer',
                      color: '#374151',
                    }}
                  >
                    Toggle Role
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
