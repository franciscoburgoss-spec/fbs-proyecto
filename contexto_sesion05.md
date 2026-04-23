# Contexto Sesion 5 — Gestión de Usuarios, Roles y Perfil

> **Hardware:** MacBook Air 7,2 · 8GB RAM · 128GB SSD · Python 3.11+ nativo
> **Objetivo:** Agregar gestión completa de usuarios: panel admin, protección por roles, perfil de usuario, cambio de contraseña.
> **Tiempo estimado:** 2-3 horas.

---

## Paso previo obligatorio

Clonar el repositorio actualizado con las sesiones 1-4:

```bash
git clone git@github.com:franciscoburgoss-spec/fbs-proyecto.git
cd fbs-proyecto
```

**NO modificar** los archivos existentes del backend (`main.py`, `database.py`, `routers/`, `schemas/`, `domain/`, `middleware/`, `tests/`) salvo las actualizaciones explicitas indicadas en esta sesion.

---

## Estado previo (sesiones 1-4 en main)

- `spec_engine/` — Motor de especificaciones completo
- `specs/` — `documento.yaml`, `proyecto.yaml` con maquinas de estado
- `backend/` — FastAPI con CORS, routers CRUD + transiciones + auth JWT, middleware de errores, 79 tests
  - `auth.py` — Login, registro, `/me`, `require_auth`, JWT
- `frontend/` — React + TypeScript, Vite, Dashboard, CRUD, hooks, Layout, LoginPage, AuthContext
- `docker-compose.yml` — Backend + Frontend + JWT_SECRET

---

## Archivos a crear en esta sesion

```
backend/
  tests/
    test_api_admin.py       # Tests de proteccion por rol, gestion usuarios, perfil
frontend/src/
  components/
    AdminPage.tsx           # Panel de admin: listar usuarios, cambiar rol, activar/desactivar
    PerfilPage.tsx          # Perfil usuario: ver datos, cambiar password
  hooks/
    useAdmin.ts             # Hook para gestion de usuarios (listar, cambiar rol, toggle activo)
```

## Archivos a modificar

```
backend/schemas/auth.py          # Agregar PasswordChangeIn, PerfilUpdate
backend/routers/auth.py          # Agregar require_admin, endpoints admin y perfil
backend/routers/proyectos.py     # Agregar require_admin a POST/DELETE
backend/routers/documentos.py    # Agregar require_admin a DELETE
backend/main.py                  # Bump version a 1.2.0
frontend/src/types.ts            # Agregar interfaces PasswordChangeIn, PerfilUpdate
frontend/src/api.ts              # Agregar endpoints admin y perfil
frontend/src/App.tsx             # Rutas /admin y /perfil
frontend/src/components/Layout.tsx  # Links a Admin (solo admin) y Perfil
```

---

## 1. backend/schemas/auth.py

Agregar dos nuevos schemas al final del archivo (despues de `TokenPayload`):

```python
class PasswordChangeIn(BaseModel):
    current_password: str
    new_password: str


class PerfilUpdate(BaseModel):
    email: Optional[EmailStr] = None
```

Importar `EmailStr` si no esta ya importado (deberia estar).

---

## 2. backend/routers/auth.py

### 2a. Agregar `require_admin` despues de `require_auth`

```python
def require_admin(user: dict = Depends(require_auth)) -> dict:
    """Dependencia: requiere rol admin. Lanza 403 si no es admin."""
    if user.get("rol") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requiere rol administrador",
        )
    return user
```

### 2b. Agregar imports necesarios

Importar `PasswordChangeIn` y `PerfilUpdate` del schema:

```python
from backend.schemas.auth import (
    UsuarioOut, RegisterIn, LoginIn, Token, TokenPayload,
    PasswordChangeIn, PerfilUpdate,
)
```

### 2c. Agregar endpoints de administracion

Despues del endpoint `me`, agregar:

```python
# --- Administracion de usuarios (solo admin) ---

@router.get("/users", response_model=list[UsuarioOut])
def listar_usuarios(user: dict = Depends(require_admin)):
    """Lista todos los usuarios. Solo admin."""
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, username, email, rol, activo, fecha_creacion FROM usuarios ORDER BY id"
        ).fetchall()
    return [dict(r) for r in rows]


@router.patch("/users/{id}/rol", response_model=UsuarioOut)
def cambiar_rol(id: int, body: dict, user: dict = Depends(require_admin)):
    """Cambia el rol de un usuario. Body: {'rol': 'admin'|'user'}."""
    nuevo_rol = body.get("rol")
    if nuevo_rol not in ("admin", "user"):
        raise HTTPException(status_code=422, detail="rol debe ser 'admin' o 'user'")

    with get_conn() as conn:
        row = conn.execute("SELECT id FROM usuarios WHERE id = ?", (id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="usuario no encontrado")

        conn.execute("UPDATE usuarios SET rol = ? WHERE id = ?", (nuevo_rol, id))
        row = conn.execute(
            "SELECT id, username, email, rol, activo, fecha_creacion FROM usuarios WHERE id = ?",
            (id,)
        ).fetchone()
    return dict(row)


@router.patch("/users/{id}/activar", response_model=UsuarioOut)
def toggle_activo(id: int, user: dict = Depends(require_admin)):
    """Activa o desactiva un usuario (toggle del campo activo)."""
    with get_conn() as conn:
        row = conn.execute("SELECT id, activo FROM usuarios WHERE id = ?", (id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="usuario no encontrado")

        # No permitir desactivarse a si mismo
        if id == user["id"]:
            raise HTTPException(status_code=400, detail="No puedes desactivarte a ti mismo")

        nuevo_estado = 0 if row["activo"] else 1
        conn.execute("UPDATE usuarios SET activo = ? WHERE id = ?", (nuevo_estado, id))
        row = conn.execute(
            "SELECT id, username, email, rol, activo, fecha_creacion FROM usuarios WHERE id = ?",
            (id,)
        ).fetchone()
    return dict(row)
```

### 2d. Agregar endpoints de perfil propio

```python
# --- Perfil propio ---

@router.patch("/me", response_model=UsuarioOut)
def actualizar_perfil(data: PerfilUpdate, user: dict = Depends(require_auth)):
    """Actualiza el email del usuario autenticado."""
    if data.email is None:
        raise HTTPException(status_code=422, detail="no se envio ningun campo editable")

    with get_conn() as conn:
        try:
            conn.execute("UPDATE usuarios SET email = ? WHERE id = ?", (data.email, user["id"]))
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=409, detail="email ya existe")

        row = conn.execute(
            "SELECT id, username, email, rol, activo, fecha_creacion FROM usuarios WHERE id = ?",
            (user["id"],)
        ).fetchone()
    return dict(row)


@router.post("/me/password")
def cambiar_password(data: PasswordChangeIn, user: dict = Depends(require_auth)):
    """Cambia la contraseña del usuario autenticado."""
    with get_conn() as conn:
        row = conn.execute("SELECT password_hash FROM usuarios WHERE id = ?", (user["id"],)).fetchone()

    if not verify_password(data.current_password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="contraseña actual incorrecta")

    nuevo_hash = get_password_hash(data.new_password)
    with get_conn() as conn:
        conn.execute("UPDATE usuarios SET password_hash = ? WHERE id = ?", (nuevo_hash, user["id"]))

    return {"detail": "contraseña actualizada"}
```

---

## 3. Proteger operaciones destructivas con require_admin

### backend/routers/proyectos.py

Solo `crear_proyecto` y `eliminar_proyecto` requieren admin. Los demas (`listar`, `obtener`, `actualizar`, `transicionar`) usan `require_auth` (cualquier usuario autenticado).

Importar `require_admin`:

```python
from backend.routers.auth import require_auth, require_admin
```

Cambiar `crear_proyecto`:

```python
@router.post("", response_model=ProyectoOut, status_code=201)
def crear_proyecto(data: ProyectoIn, user: dict = Depends(require_admin)):
    # ... logica igual
```

Cambiar `eliminar_proyecto`:

```python
@router.delete("/{id}", status_code=204)
def eliminar_proyecto(id: int, user: dict = Depends(require_admin)):
    # ... logica igual
```

### backend/routers/documentos.py

Solo `eliminar_documento` requiere admin. El resto usa `require_auth`.

Importar:

```python
from backend.routers.auth import require_auth, require_admin
```

Cambiar `eliminar_documento`:

```python
@router.delete("/{id}", status_code=204)
def eliminar_documento(id: int, user: dict = Depends(require_admin)):
    # ... logica igual
```

---

## 4. Actualizar backend/main.py

Bump de version:

```python
app = FastAPI(
    title="FBS API",
    version="1.2.0",  # Bump version
    description="Backend de gestion de proyectos y documentos con spec_engine, auth JWT y roles",
)
```

---

## 5. frontend/src/types.ts

Agregar interfaces al final del archivo:

```typescript
export interface PasswordChangeIn {
  current_password: string
  new_password: string
}

export interface PerfilUpdate {
  email?: string
}
```

---

## 6. frontend/src/api.ts

Agregar funciones despues de `obtenerPerfil`:

```typescript
// --- Admin (requiere rol admin) ---
export const listarUsuarios = () =>
  api.get<Usuario[]>('/auth/users').then(r => r.data)

export const cambiarRol = (id: number, rol: 'admin' | 'user') =>
  api.patch<Usuario>(`/auth/users/${id}/rol`, { rol }).then(r => r.data)

export const toggleActivo = (id: number) =>
  api.patch<Usuario>(`/auth/users/${id}/activar`).then(r => r.data)

// --- Perfil propio ---
export const actualizarPerfil = (data: PerfilUpdate) =>
  api.patch<Usuario>('/auth/me', data).then(r => r.data)

export const cambiarPassword = (data: PasswordChangeIn) =>
  api.post('/auth/me/password', data).then(r => r.data)
```

Importar `PasswordChangeIn` y `PerfilUpdate` en la linea de imports:

```typescript
import type { Proyecto, ProyectoIn, Documento, DocumentoIn, Usuario, LoginIn, RegisterIn, Token, PasswordChangeIn, PerfilUpdate } from './types'
```

---

## 7. frontend/src/hooks/useAdmin.ts

```typescript
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
```

---

## 8. frontend/src/components/AdminPage.tsx

```tsx
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
```

---

## 9. frontend/src/components/PerfilPage.tsx

```tsx
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { actualizarPerfil, cambiarPassword } from '../api'
import type { PerfilUpdate, PasswordChangeIn } from '../types'

export default function PerfilPage() {
  const { user, login } = useAuth()
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
```

---

## 10. Actualizar frontend/src/App.tsx

Agregar imports y rutas nuevas:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import ProyectoList from './components/ProyectoList'
import DocumentoList from './components/DocumentoList'
import LoginPage from './components/LoginPage'
import AdminPage from './components/AdminPage'
import PerfilPage from './components/PerfilPage'

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <p style={{ textAlign: 'center', marginTop: 100 }}>Cargando...</p>
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route element={user ? <Layout /> : <Navigate to="/login" replace />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/proyectos" element={<ProyectoList />} />
        <Route path="/documentos" element={<DocumentoList />} />
        <Route path="/perfil" element={<PerfilPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
```

---

## 11. Actualizar frontend/src/components/Layout.tsx

Agregar links a `/perfil` y `/admin` (solo admin) en el sidebar:

```tsx
import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/proyectos', label: 'Proyectos' },
  { to: '/documentos', label: 'Documentos' },
  { to: '/perfil', label: 'Mi Perfil' },
]

export default function Layout() {
  const { user, logout } = useAuth()

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <aside style={{ width: 200, borderRight: '1px solid #ddd', padding: 16, display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ margin: '0 0 16px' }}>FBS</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                padding: '8px 12px',
                borderRadius: 4,
                textDecoration: 'none',
                color: isActive ? '#fff' : '#333',
                background: isActive ? '#2563eb' : 'transparent',
              })}
            >
              {item.label}
            </NavLink>
          ))}
          {user?.rol === 'admin' && (
            <NavLink
              to="/admin"
              style={({ isActive }) => ({
                padding: '8px 12px',
                borderRadius: 4,
                textDecoration: 'none',
                color: isActive ? '#fff' : '#b45309',
                background: isActive ? '#2563eb' : '#fef3c7',
                fontWeight: 600,
              })}
            >
              Admin
            </NavLink>
          )}
        </nav>

        {/* Footer del sidebar con usuario y logout */}
        {user && (
          <div style={{ borderTop: '1px solid #eee', paddingTop: 12, marginTop: 'auto' }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
              {user.username} ({user.rol})
            </div>
            <button
              onClick={logout}
              style={{ width: '100%', padding: '6px 8px', fontSize: 12, cursor: 'pointer' }}
            >
              Cerrar sesion
            </button>
          </div>
        )}
      </aside>
      <main style={{ flex: 1, padding: 24, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
```

---

## 12. backend/tests/test_api_admin.py

```python
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


class TestAdmin:
    @pytest.fixture(autouse=True)
    def setup(self):
        """Limpiar usuarios no-admin antes de cada test."""
        from backend.database import get_conn
        with get_conn() as conn:
            conn.execute("DELETE FROM usuarios WHERE username != 'admin'")

    def _login(self, username, password):
        r = client.post("/api/auth/login", json={"username": username, "password": password})
        assert r.status_code == 200
        return r.json()["access_token"]

    # --- listar usuarios ---

    def test_listar_usuarios_como_admin(self):
        token = self._login("admin", "admin123")
        r = client.get("/api/auth/users", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 1  # al menos el admin

    def test_listar_usuarios_como_user_devuelve_403(self):
        # Crear un usuario normal
        client.post("/api/auth/register", json={
            "username": "normaluser",
            "email": "normal@example.com",
            "password": "pass123"
        })
        token = self._login("normaluser", "pass123")
        r = client.get("/api/auth/users", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 403

    def test_listar_usuarios_sin_token_devuelve_401(self):
        r = client.get("/api/auth/users")
        assert r.status_code == 401

    # --- cambiar rol ---

    def test_admin_cambia_rol_de_usuario(self):
        client.post("/api/auth/register", json={
            "username": "targetuser",
            "email": "target@example.com",
            "password": "pass123"
        })
        admin_token = self._login("admin", "admin123")
        # Obtener ID del usuario creado
        users = client.get("/api/auth/users", headers={"Authorization": f"Bearer {admin_token}"}).json()
        target = [u for u in users if u["username"] == "targetuser"][0]

        r = client.patch(
            f"/api/auth/users/{target['id']}/rol",
            json={"rol": "admin"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 200
        assert r.json()["rol"] == "admin"

    def test_usuario_normal_no_puede_cambiar_rol(self):
        client.post("/api/auth/register", json={
            "username": "user1",
            "email": "u1@example.com",
            "password": "pass123"
        })
        client.post("/api/auth/register", json={
            "username": "user2",
            "email": "u2@example.com",
            "password": "pass123"
        })
        token1 = self._login("user1", "pass123")
        # Necesitamos el ID de user2 - consultar via admin
        admin_token = self._login("admin", "admin123")
        users = client.get("/api/auth/users", headers={"Authorization": f"Bearer {admin_token}"}).json()
        target = [u for u in users if u["username"] == "user2"][0]

        r = client.patch(
            f"/api/auth/users/{target['id']}/rol",
            json={"rol": "admin"},
            headers={"Authorization": f"Bearer {token1}"},
        )
        assert r.status_code == 403

    # --- toggle activo ---

    def test_admin_desactiva_usuario(self):
        client.post("/api/auth/register", json={
            "username": "desactuser",
            "email": "desact@example.com",
            "password": "pass123"
        })
        admin_token = self._login("admin", "admin123")
        users = client.get("/api/auth/users", headers={"Authorization": f"Bearer {admin_token}"}).json()
        target = [u for u in users if u["username"] == "desactuser"][0]
        assert target["activo"] == True

        r = client.patch(
            f"/api/auth/users/{target['id']}/activar",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 200
        assert r.json()["activo"] == False

    def test_admin_no_puede_desactivarse_a_si_mismo(self):
        admin_token = self._login("admin", "admin123")
        users = client.get("/api/auth/users", headers={"Authorization": f"Bearer {admin_token}"}).json()
        admin_user = [u for u in users if u["username"] == "admin"][0]

        r = client.patch(
            f"/api/auth/users/{admin_user['id']}/activar",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 400

    # --- perfil ---

    def test_actualizar_perfil_email(self):
        client.post("/api/auth/register", json={
            "username": "perfiluser",
            "email": "old@example.com",
            "password": "pass123"
        })
        token = self._login("perfiluser", "pass123")
        r = client.patch(
            "/api/auth/me",
            json={"email": "new@example.com"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert r.status_code == 200
        assert r.json()["email"] == "new@example.com"

    def test_cambiar_password_correcto(self):
        client.post("/api/auth/register", json={
            "username": "pwduser",
            "email": "pwd@example.com",
            "password": "oldpass123"
        })
        token = self._login("pwduser", "oldpass123")
        r = client.post(
            "/api/auth/me/password",
            json={"current_password": "oldpass123", "new_password": "newpass456"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert r.status_code == 200
        # Verificar que el nuevo password funciona
        login_r = client.post("/api/auth/login", json={"username": "pwduser", "password": "newpass456"})
        assert login_r.status_code == 200
        assert "access_token" in login_r.json()

    def test_cambiar_password_con_actual_incorrecta(self):
        client.post("/api/auth/register", json={
            "username": "pwduser2",
            "email": "pwd2@example.com",
            "password": "correctpass"
        })
        token = self._login("pwduser2", "correctpass")
        r = client.post(
            "/api/auth/me/password",
            json={"current_password": "wrongpass", "new_password": "newpass456"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert r.status_code == 401

    # --- proteccion por rol en proyectos ---

    def test_crear_proyecto_requiere_admin(self):
        client.post("/api/auth/register", json={
            "username": "normaluser3",
            "email": "n3@example.com",
            "password": "pass123"
        })
        user_token = self._login("normaluser3", "pass123")
        r = client.post(
            "/api/proyectos",
            json={"nombre": "X", "acronimo": "TEST-99"},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert r.status_code == 403

    def test_crear_proyecto_como_admin_funciona(self):
        admin_token = self._login("admin", "admin123")
        r = client.post(
            "/api/proyectos",
            json={"nombre": "X", "acronimo": "TEST-99"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 201

    def test_listar_proyectos_cualquier_usuario_autenticado(self):
        client.post("/api/auth/register", json={
            "username": "viewer",
            "email": "viewer@example.com",
            "password": "pass123"
        })
        token = self._login("viewer", "pass123")
        r = client.get("/api/proyectos", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200

    def test_eliminar_proyecto_requiere_admin(self):
        client.post("/api/auth/register", json={
            "username": "normaluser4",
            "email": "n4@example.com",
            "password": "pass123"
        })
        user_token = self._login("normaluser4", "pass123")
        # Proyecto 2 no tiene documentos asociados que impidan borrar (verificar segun seed)
        r = client.delete("/api/proyectos/2", headers={"Authorization": f"Bearer {user_token}"})
        assert r.status_code == 403
```

---

## Archivos existentes (NO MODIFICAR salvo lo indicado arriba)

```
spec_engine/
specs/
backend/domain/
backend/middleware/
backend/registro.py
backend/database.py             # sin cambios (tabla usuarios ya existe de sesion 4)
backend/schemas/documento.py    # sin cambios
backend/schemas/proyecto.py     # sin cambios
backend/tests/test_api_auth.py  # sin cambios
backend/tests/test_database.py  # sin cambios
backend/tests/test_*transitions.py  # sin cambios
frontend/src/components/Dashboard.tsx       # sin cambios
frontend/src/components/ProyectoList.tsx    # sin cambios
frontend/src/components/DocumentoList.tsx   # sin cambios
frontend/src/components/LoginPage.tsx       # sin cambios
frontend/src/hooks/useProyectos.ts          # sin cambios
frontend/src/hooks/useDocumentos.ts         # sin cambios
frontend/src/hooks/useStats.ts              # sin cambios
frontend/src/hooks/useAuth.ts               # sin cambios
frontend/src/context/AuthContext.tsx        # sin cambios
frontend/src/main.tsx                       # sin cambios
frontend/vite.config.ts                     # sin cambios
frontend/tsconfig*.json                     # sin cambios
frontend/index.html                         # sin cambios
frontend/package.json                       # sin cambios
Dockerfile.backend                          # sin cambios
Dockerfile.frontend                         # sin cambios
docker-compose.yml                          # sin cambios
```

---

## Invariantes a respetar

| Inv | Texto | Como se verifica |
|-----|-------|------------------|
| I-5  | Frontend puede consumir API | Interceptor JWT agrega header Authorization |
| I-6  | Separacion backend/frontend | Auth context solo en frontend, JWT solo en backend |
| I-8  | Transiciones solo via spec_engine | Sin cambios, ya implementado |
| I-11 | Feedback visual de errores | AdminPage y PerfilPage muestran errores |
| I-14 | Docker compose levanta todo | Sin cambios respecto a sesion 4 |
| I-15 | Passwords nunca en texto plano | passlib bcrypt hashea passwords |
| I-16 | Token JWT expira | exp claim en token, default 24h |
| I-17 | Rutas protegidas | 401 sin token, 403 sin rol adecuado |
| I-18 | Primer usuario es admin | Logica ya existente en /register |
| I-19 | Separacion de privilegios | Admin puede gestionar usuarios, user solo su perfil |
| I-20 | Auto-proteccion de admin | No puede desactivarse a si mismo |
| I-21 | Operaciones destructivas protegidas | Crear/eliminar proyecto y eliminar documento requieren admin |

---

## Checklist de verificacion final

```bash
# 1. Tests
pytest backend/tests/ -v                    # Esperado: 79 + ~15 admin = ~94 pasando

# 2. Backend
uvicorn backend.main:app --reload --port 8000

# 3. Frontend
cd frontend && npm run dev

# 4. Verificar en navegador http://localhost:5173
#    - Login con admin/admin123 funciona
#    - Link "Admin" visible en sidebar (solo para admin)
#    - Panel Admin: listar usuarios, cambiar rol, activar/desactivar
#    - No puede desactivarse a si mismo
#    - Login con usuario normal (registrado via /register)
#    - Link "Admin" NO visible para usuario normal
#    - Acceso directo a /admin como user normal -> redireccion o 403
#    - Mi Perfil: ver datos, cambiar email, cambiar password
#    - Cambio de password con contraseña actual incorrecta -> error
#    - Usuario normal puede listar proyectos (GET /api/proyectos)
#    - Usuario normal NO puede crear proyecto (POST /api/proyectos -> 403)
#    - Usuario normal NO puede eliminar proyecto (DELETE /api/proyectos -> 403)
#    - Usuario normal NO puede eliminar documento (DELETE /api/documentos -> 403)

# 5. Docker
docker compose up --build
```

## Notas para el agente

- `require_admin` reutiliza `require_auth` internamente (Depends), asi que primero verifica autenticacion y luego rol.
- El endpoint `DELETE /api/proyectos/{id}` en el test usa proyecto_id=2 (Proyecto Sur). Si el seed de la sesion 4 agrego documentos a todos los proyectos, puede que el DELETE falle por 409 (tiene documentos) antes de llegar a la verificacion de admin. El test `test_eliminar_proyecto_requiere_admin` espera 403, asi que se necesita un proyecto sin documentos. **Opcion A**: Cambiar el test para que cree un proyecto primero (como admin) y luego intente eliminarlo como user. **Opcion B**: Usar un proyecto del seed que no tenga documentos.
- Los badges de rol y estado en AdminPage usan colores inline para distinguir visualmente.
- La ruta `/admin` en App.tsx no tiene proteccion explicita de rol a nivel de ruta; el redireccion se hace dentro de AdminPage con `useEffect`. Alternativa: crear un componente `AdminRoute` wrapper.
- No se implementa "recuperar usuario desactivado" ni "eliminar usuario permanentemente" (soft delete) en esta sesion.
- El hook `useAdmin` mantiene el estado local sincronizado con `setUsuarios(prev => ...)` para feedback inmediato sin recargar.
