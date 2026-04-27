# FBS Sistema de Control de Documentos — Contexto Sesion 16

> **Fecha:** 2026-04-27
> **Sesion anterior:** Sesion 15 — Auditoria de Eventos en /tasks implementada
> **Repositorio:** https://github.com/franciscoburgoss-spec/fbs-proyecto
> **Deploy actual:** https://tphfdoyzgcbs6.kimi.show

---

## 1. Estado Actual del Proyecto (Post-Sesion 15)

### 1.1 Stack Tecnologico

| Capa | Tecnologia |
|------|-----------|
| **Frontend** | React 18 + TypeScript + Tailwind CSS v4 + lucide-react + Vite + recharts |
| **Backend** | Python 3 + FastAPI + SQLite3 |
| **Auth** | JWT (login con username/password) |
| **Deploy** | Frontend estatico + Backend local (puertos 5173/8000) |

### 1.2 Estructura de Directorios

```
fbs-proyecto/
├── backend/
│   ├── routers/              # auth.py, proyectos.py, documentos.py, eventos.py, reportes.py
│   ├── schemas/              # auth.py, proyectos.py, documentos.py, eventos.py, reportes.py
│   ├── domain/
│   ├── registro.py          # emit_evento — guarda en SQLite + JSONL
│   ├── database.py          # init_db() con tablas usuarios, proyectos, documentos, eventos
│   ├── main.py
│   └── data/app.db
├── frontend/
│   ├── src/
│   │   ├── components/       # 25+ componentes .tsx
│   │   │   ├── TasksPage.tsx         # AUDITORIA completa (Session 15)
│   │   │   ├── UsersRolesPage.tsx    # PLACEHOLDER — estilos inline basicos (Session 16)
│   │   │   ├── Dashboard.tsx         # Con toast, ProjectTimeline con transicion
│   │   │   ├── ModulesPage.tsx       # Reportes con recharts
│   │   │   └── ...
│   │   ├── hooks/            # useAuth.ts, useAdmin.ts, useAuditoria.ts, etc.
│   │   ├── context/          # AuthContext.tsx, ProyectoActivoContext.tsx
│   │   ├── api.ts            # funciones axios
│   │   ├── types.ts          # interfaces TypeScript
│   │   └── App.tsx           # Rutas
│   ├── dist/
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
└── scripts/start.sh
```

---

## 2. Funcionalidades IMPLEMENTADAS (Sesion 15)

### 2.1 Auditoria de Eventos en /tasks — COMPLETADA

- `TasksPage.tsx` reescrito con feed completo de eventos
- KPI cards con `stats.total` y desglose por tipo
- Filtros: tipo de evento, fecha desde/hasta, limite (50/100/250)
- Badges de colores por categoria (creado/actualizado/eliminado/transicion)
- Proteccion de ruta solo admin con redirect a `/`
- Toast de confirmacion al refrescar
- Loading state, error state, empty state
- Formato de timestamps y parseo de detalle JSON

---

## 3. Funcionalidad PENDIENTE (Sesion 16) — Users & Roles en /users

### 3.1 Descripcion

La ruta `/users` muestra actualmente `UsersRolesPage.tsx` con **estilos inline basicos** (tabla simple, busqueda basica). Se requiere profesionalizar la pagina para que sea consistente con el resto de la aplicacion (Dashboard, ModulesPage, TasksPage).

Se debe implementar una **pagina de Gestion de Usuarios y Roles** profesional en `/users` que:

1. **Muestre todos los usuarios del sistema** en una tabla estilizada con Tailwind
2. **Solo sea visible para admin** — redirigir a `/` si el usuario no es admin
3. **Reutilice `useAdmin.ts`** (ya implementado y funcional)
4. **Aplique estilos Tailwind consistentes** con el resto de la app
5. **Incluya KPI cards**: total usuarios, admins activos, usuarios activos, inactivos
6. **Filtros**: busqueda por username/email, filtro por rol, filtro por estado (activo/inactivo)
7. **Acciones por fila**: cambiar rol (admin/user), activar/desactivar usuario
8. **Modal de confirmacion** para cambios sensibles (cambio de rol, desactivacion)
9. **Modal para crear nuevo usuario** (admin-only)
10. **Toast de feedback** tras cada operacion exitosa o error
11. **Estado vacio**: "No users found" cuando no hay resultados

### 3.2 Backend disponible

El backend ya tiene todo implementado. No requiere modificaciones.

#### Endpoints existentes (backend/routers/auth.py):

```python
POST   /api/auth/register           # Registro (primer usuario = admin)
POST   /api/auth/login              # Login con JWT
GET    /api/auth/me                 # Perfil del usuario autenticado
GET    /api/auth/users              # Listar todos los usuarios (solo admin)
PATCH  /api/auth/users/{id}/rol     # Cambiar rol admin/user (solo admin)
PATCH  /api/auth/users/{id}/activar # Toggle activo/inactivo (solo admin)
PATCH  /api/auth/me                 # Actualizar email propio
POST   /api/auth/me/password        # Cambiar password propio
```

#### Tabla `usuarios` (database.py):

```sql
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'user' CHECK(rol IN ('admin', 'user')),
    activo INTEGER NOT NULL DEFAULT 1,
    fecha_creacion TEXT DEFAULT (datetime('now'))
);
```

#### Schema UsuarioOut (backend/schemas/auth.py):

```python
class UsuarioOut(BaseModel):
    id: int
    username: str
    email: str
    rol: Literal["admin", "user"]
    activo: bool
    fecha_creacion: str
```

### 3.3 API ya disponible (frontend/src/api.ts)

```typescript
// Admin (requiere rol admin)
export const listarUsuarios = () =>
  api.get<Usuario[]>('/auth/users').then(r => r.data)

export const cambiarRol = (id: number, rol: 'admin' | 'user') =>
  api.patch<Usuario>(`/auth/users/${id}/rol`, { rol }).then(r => r.data)

export const toggleActivo = (id: number) =>
  api.patch<Usuario>(`/auth/users/${id}/activar`).then(r => r.data)

// Auth
export const register = (data: RegisterIn) =>
  api.post<Usuario>('/auth/register', data).then(r => r.data)
```

#### Hook `useAdmin.ts` ya expone todo:

```typescript
const { usuarios, loading, error, cargar, cambiarRolUsuario, toggleUsuarioActivo } = useAdmin()
```

### 3.4 Tipos TypeScript (frontend/src/types.ts)

```typescript
export interface Usuario {
  id: number
  username: string
  email: string
  rol: 'admin' | 'user'
  activo: boolean
  fecha_creacion: string
}

export interface RegisterIn {
  username: string
  email: string
  password: string
  rol?: 'admin' | 'user'
}

export interface PasswordChangeIn {
  current_password: string
  new_password: string
}

export interface PerfilUpdate {
  email?: string
}
```

---

## 4. Codigo Relevante Completo

### 4.1 UsersRolesPage.tsx (ACTUAL — estilos inline basicos)

```tsx
// src/components/UsersRolesPage.tsx
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
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                    background: u.rol === 'admin' ? '#dbeafe' : '#f3f4f6',
                    color: u.rol === 'admin' ? '#1e40af' : '#6b7280',
                  }}>
                    {u.rol}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ fontSize: 12, color: u.activo ? '#065f46' : '#991b1b' }}>
                    {u.activo ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <button
                    onClick={() => cambiarRolUsuario(u.id, u.rol === 'admin' ? 'user' : 'admin')}
                    style={{ fontSize: 12, padding: '4px 8px', cursor: 'pointer' }}
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
```

**Problemas con la version actual:**
- Estilos inline en vez de Tailwind
- No usa `cargar()` del hook — los usuarios no se cargan al montar
- No tiene proteccion de ruta (cualquiera puede ver la pagina)
- No usa `toggleUsuarioActivo` del hook
- No tiene KPI cards
- No tiene filtros por rol ni por estado
- No tiene modal de confirmacion
- No tiene boton para crear usuario
- No tiene toast de feedback
- No tiene estado vacio profesional
- No tiene loading skeleton

### 4.2 useAdmin.ts (hook ya implementado)

```typescript
// src/hooks/useAdmin.ts
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

**Nota importante:** El hook expone `cargar()` pero `UsersRolesPage.tsx` actual NO lo llama. La nueva version debe llamar `cargar()` en un `useEffect` al montar el componente.

### 4.3 auth.py (backend completo)

```python
# backend/routers/auth.py
import os
import sqlite3
import time
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
import bcrypt
from typing import Optional

from backend.database import get_conn
from backend.schemas.auth import (
    UsuarioOut, RegisterIn, LoginIn, Token, TokenPayload,
    PasswordChangeIn, PerfilUpdate,
)

router = APIRouter()

SECRET_KEY = os.environ.get("JWT_SECRET")
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET environment variable is required.")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("JWT_EXPIRE_MINUTES", "1440"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[dict]:
    if token is None:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None

    with get_conn() as conn:
        row = conn.execute(
            "SELECT id, username, email, rol, activo, fecha_creacion FROM usuarios WHERE id = ?",
            (int(user_id),)
        ).fetchone()
    return dict(row) if row else None


def require_auth(user: Optional[dict] = Depends(get_current_user)) -> dict:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_admin(user: dict = Depends(require_auth)) -> dict:
    if user.get("rol") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requiere rol administrador",
        )
    return user


@router.post("/register", response_model=UsuarioOut, status_code=201)
def register(data: RegisterIn):
    hashed = get_password_hash(data.password)
    with get_conn() as conn:
        count = conn.execute("SELECT COUNT(*) FROM usuarios").fetchone()[0]
        rol = "admin" if count == 0 else data.rol
        try:
            cursor = conn.execute(
                "INSERT INTO usuarios (username, email, password_hash, rol) VALUES (?, ?, ?, ?)",
                (data.username, data.email, hashed, rol),
            )
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=409, detail="username o email ya existe")
        user_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM usuarios WHERE id = ?", (user_id,)).fetchone()
    return dict(row)


# Rate limiting en memoria
_login_attempts: dict = {}
MAX_LOGIN_ATTEMPTS = 5
LOGIN_WINDOW_SECONDS = 60


def _check_rate_limit(ip: str):
    now = time.time()
    entry = _login_attempts.get(ip)
    if entry:
        if now - entry["first"] > LOGIN_WINDOW_SECONDS:
            _login_attempts[ip] = {"count": 0, "first": now}
            return
        if entry["count"] >= MAX_LOGIN_ATTEMPTS:
            raise HTTPException(status_code=429, detail="Demasiados intentos. Espera 1 minuto.")
    else:
        _login_attempts[ip] = {"count": 0, "first": now}


def _record_failed_attempt(ip: str):
    now = time.time()
    entry = _login_attempts.get(ip)
    if entry:
        if now - entry["first"] > LOGIN_WINDOW_SECONDS:
            _login_attempts[ip] = {"count": 1, "first": now}
        else:
            entry["count"] += 1
    else:
        _login_attempts[ip] = {"count": 1, "first": now}


def _get_client_ip(request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post("/login", response_model=Token)
def login(data: LoginIn, request: Request):
    ip = _get_client_ip(request)
    _check_rate_limit(ip)
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM usuarios WHERE username = ?", (data.username,)
        ).fetchone()
    if not row or not verify_password(data.password, row["password_hash"]):
        _record_failed_attempt(ip)
        raise HTTPException(status_code=401, detail="credenciales invalidas")
    access_token = create_access_token(data={"sub": str(row["id"])})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UsuarioOut)
def me(user: dict = Depends(require_auth)):
    return user


# --- Administracion de usuarios (solo admin) ---

@router.get("/users", response_model=list[UsuarioOut])
def listar_usuarios(user: dict = Depends(require_admin)):
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, username, email, rol, activo, fecha_creacion FROM usuarios ORDER BY id"
        ).fetchall()
    return [dict(r) for r in rows]


@router.patch("/users/{id}/rol", response_model=UsuarioOut)
def cambiar_rol(id: int, body: dict, user: dict = Depends(require_admin)):
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


# --- Perfil propio ---

@router.patch("/me", response_model=UsuarioOut)
def actualizar_perfil(data: PerfilUpdate, user: dict = Depends(require_auth)):
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
    with get_conn() as conn:
        row = conn.execute("SELECT password_hash FROM usuarios WHERE id = ?", (user["id"],)).fetchone()
    if not verify_password(data.current_password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="contraseña actual incorrecta")
    nuevo_hash = get_password_hash(data.new_password)
    with get_conn() as conn:
        conn.execute("UPDATE usuarios SET password_hash = ? WHERE id = ?", (nuevo_hash, user["id"]))
    return {"detail": "contraseña actualizada"}
```

### 4.4 App.tsx (rutas)

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProyectoActivoProvider } from './context/ProyectoActivoContext'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import DocumentsPage from './components/DocumentsPage'
import ModulesPage from './components/ModulesPage'
import TasksPage from './components/TasksPage'
import UsersRolesPage from './components/UsersRolesPage'
import SettingsPage from './components/SettingsPage'
import LoginPage from './components/LoginPage'

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <p style={{ textAlign: 'center', marginTop: 100 }}>Cargando...</p>
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route element={user ? <Layout /> : <Navigate to="/login" replace />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/modules" element={<ModulesPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/users" element={<UsersRolesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProyectoActivoProvider>
          <AppRoutes />
        </ProyectoActivoProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
```

### 4.5 Layout.tsx (nav item)

```tsx
const navItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/modules', label: 'Modules', icon: Folder },
  { to: '/tasks', label: 'My Tasks', icon: LayoutGrid },
  { to: '/users', label: 'Users & Roles', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
]
```

### 4.6 useAuth.ts + AuthContext

```tsx
// useAuth() retorna: { user, token, loading, error, login, register, logout, clearError }
// user.rol es 'admin' | 'user'
// El contexto valida el token al montar cargando el perfil via GET /auth/me
```

---

## 5. Patrones de UI Establecidos (copiar exactamente)

### 5.1 Page Header

```
<div className="flex justify-between items-start mb-6">
  <div className="flex items-center gap-2">
    <Icon size={18} className="text-[#6b7280]" />
    <h1 className="text-lg font-semibold text-[#111827]">Page Title</h1>
  </div>
  <p className="text-[13px] text-[#9ca3af] mt-1">Subtitle description</p>
</div>
```

### 5.2 KPI Cards (como en ModulesPage y TasksPage)

```
Contenedor: grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6
Card:       border border-[#e5e7eb] rounded-lg bg-white p-4
Valor:      text-2xl font-bold text-[#111827]
Label:      text-[12px] text-[#6b7280] mt-1
```

### 5.3 Tabla estilizada

```
Contenedor: border border-[#e5e7eb] rounded-lg bg-white overflow-hidden
Tabla:      w-full text-[13px]
Header:     bg-[#f9fafb] border-b border-[#e5e7eb]
  th:       px-4 py-3 text-left font-semibold text-[#374151] text-[12px] uppercase tracking-wide
Row:        border-b border-[#f3f4f6] hover:bg-[#f9fafb] transition-colors
  td:       px-4 py-3
```

### 5.4 Badges de colores

```
Admin:      bg-[#dbeafe] text-[#1e40af] border border-[#bfdbfe]
User:       bg-[#f3f4f6] text-[#374151] border border-[#e5e7eb]
Active:     bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]
Inactive:   bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]
```

### 5.5 Filtros inline

```
Contenedor: flex items-center gap-3 mb-4 flex-wrap
Select:     px-3 py-2 rounded-md border border-[#e5e7eb] bg-white text-[13px] text-[#374151]
Input text: px-3 py-2 rounded-md border border-[#e5e7eb] bg-white text-[13px]
Boton:      px-4 py-2 rounded-md border border-[#e5e7eb] bg-white text-[13px] hover:bg-[#f9fafb]
```

### 5.6 Toast

```tsx
const [toast, setToast] = useState<string | null>(null)
// Verde (exito):  bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46]
// Rojo (error):   bg-[#fef2f2] border border-[#fecaca] text-[#991b1b]
```

### 5.7 Modal de confirmacion

```
Overlay:    fixed inset-0 bg-black/30 z-40 flex items-center justify-center
Card:       bg-white rounded-lg shadow-lg p-6 w-[420px]
Titulo:     text-base font-semibold text-[#111827] mb-2
Mensaje:    text-[13px] text-[#6b7280] mb-6
Botones:    flex justify-end gap-3
  Cancelar: px-4 py-2 rounded-md border border-[#e5e7eb] text-[13px] hover:bg-[#f9fafb]
  Confirmar: px-4 py-2 rounded-md text-[13px] text-white
             (rojo para peligroso: bg-red-600 hover:bg-red-700)
             (azul para normal: bg-[#111827] hover:bg-[#374151])
```

### 5.8 Iconos (lucide-react) para Users & Roles

```tsx
import {
  Users, UserPlus, Search, Shield, ShieldCheck, User,
  UserCheck, UserX, ChevronDown, RefreshCw, AlertCircle,
  CheckCircle, XCircle, Pencil, Trash2, ChevronLeft, ChevronRight
} from 'lucide-react'
```

---

## 6. Plan de Implementacion — Users & Roles

### Paso 1: Reescribir UsersRolesPage.tsx

Reemplazar la version inline por una pagina profesional:

1. **Header**: "Users & Roles" / "Manage system users and their permissions" con icono Users
2. **KPI Cards**: Total Users, Admins, Active Users, Inactive Users
3. **Barra de acciones**: Boton "Add User" + filtros (busqueda, rol, estado) + refresh
4. **Tabla**: ID | Username | Email | Role (badge) | Status (badge) | Created | Actions
5. **Acciones por fila**: Toggle Role, Toggle Status (con modales de confirmacion)
6. **Modal de confirmacion**: para cambios sensibles (reutilizable)
7. **Modal de creacion de usuario**: formulario con username, email, password, rol
8. **Empty state**: "No users found" cuando no hay datos
9. **Loading**: spinner o skeleton mientras `loading` es true
10. **Error**: banner rojo si `error` no es null
11. **Toast**: feedback tras cada operacion

### Paso 2: Proteccion de ruta (solo admin)

```tsx
useEffect(() => {
  if (user && user.rol !== 'admin') {
    navigate('/')
  }
}, [user, navigate])
```

### Paso 3: Colores de badges

```tsx
const getRoleBadge = (rol: string) => {
  if (rol === 'admin') return 'bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]'
  return 'bg-[#f3f4f6] text-[#374151] border-[#e5e7eb]'
}

const getStatusBadge = (activo: boolean) => {
  if (activo) return 'bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]'
  return 'bg-[#fef2f2] text-[#991b1b] border-[#fecaca]'
}
```

### Paso 4: Formatear fecha

```tsx
const fmtDate = (ts: string) =>
  new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
```

### Paso 5: Modal de confirmacion (reutilizable)

```tsx
interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmText: string
  confirmVariant?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}
```

### Paso 6: Modal de nuevo usuario

```tsx
interface NuevoUsuarioModalProps {
  open: boolean
  onClose: () => void
  onCreate: (data: { username: string; email: string; password: string; rol: 'admin' | 'user' }) => void
}
```

Usar `register()` de `api.ts` para crear el usuario. **Nota:** El endpoint `POST /auth/register` permite enviar `rol`, pero solo si el usuario ya es admin. El backend ya valida esto.

---

## 7. Pseudocodigo de la implementacion

### UsersRolesPage.tsx (nueva version)

```tsx
export default function UsersRolesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { usuarios, loading, error, cargar, cambiarRolUsuario, toggleUsuarioActivo } = useAdmin()

  // Estados de filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState<'all' | 'admin' | 'user'>('all')
  const [filtroEstado, setFiltroEstado] = useState<'all' | 'active' | 'inactive'>('all')

  // Estados de UI
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null)
  const [showNuevoModal, setShowNuevoModal] = useState(false)

  // Proteger ruta
  useEffect(() => {
    if (user && user.rol !== 'admin') navigate('/')
  }, [user, navigate])

  // Cargar datos al montar
  useEffect(() => {
    if (user?.rol === 'admin') cargar()
  }, [user, cargar])

  // Auto-clear toast
  useEffect(() => { ... }, [toast])

  // Filtrar usuarios
  const filtrados = usuarios.filter(u => {
    const matchBusqueda = u.username.toLowerCase().includes(busqueda.toLowerCase()) ||
                          u.email.toLowerCase().includes(busqueda.toLowerCase())
    const matchRol = filtroRol === 'all' || u.rol === filtroRol
    const matchEstado = filtroEstado === 'all' ||
                        (filtroEstado === 'active' && u.activo) ||
                        (filtroEstado === 'inactive' && !u.activo)
    return matchBusqueda && matchRol && matchEstado
  })

  // Computar KPIs
  const total = usuarios.length
  const admins = usuarios.filter(u => u.rol === 'admin').length
  const activos = usuarios.filter(u => u.activo).length
  const inactivos = usuarios.filter(u => !u.activo).length

  // Handlers con confirmacion
  const handleToggleRole = (u: Usuario) => {
    const nuevoRol = u.rol === 'admin' ? 'user' : 'admin'
    setConfirmModal({
      title: `Change role for ${u.username}`,
      message: `Are you sure you want to change ${u.username} from ${u.rol} to ${nuevoRol}?`,
      onConfirm: async () => {
        try {
          await cambiarRolUsuario(u.id, nuevoRol)
          setToast({ msg: `Role updated for ${u.username}`, type: 'success' })
        } catch { setToast({ msg: 'Error updating role', type: 'error' }) }
        setConfirmModal(null)
      }
    })
  }

  const handleToggleStatus = (u: Usuario) => {
    const accion = u.activo ? 'deactivate' : 'activate'
    setConfirmModal({
      title: `${accion.charAt(0).toUpperCase() + accion.slice(1)} ${u.username}`,
      message: `Are you sure you want to ${accion} ${u.username}?`,
      confirmVariant: u.activo ? 'danger' : 'primary',
      onConfirm: async () => { ... }
    })
  }

  const handleCrearUsuario = async (data: RegisterIn) => {
    try {
      await register(data)
      setToast({ msg: `User ${data.username} created`, type: 'success' })
      cargar() // refrescar lista
      setShowNuevoModal(false)
    } catch { setToast({ msg: 'Error creating user', type: 'error' }) }
  }

  if (!user || user.rol !== 'admin') return null

  return (
    <div>
      {/* Header con boton Add User */}
      {/* KPI Cards */}
      {/* Filtros */}
      {/* Tabla */}
      {/* ConfirmModal */}
      {/* NuevoUsuarioModal */}
    </div>
  )
}
```

---

## 8. Datos de prueba

```
Usuarios esperados en DB (ya generados por operaciones previas):
- admin / admin123 (rol: admin, activo: true)  ← puede ver /users
- user1 / user123  (rol: user, activo: true)   ← redirigido a Dashboard

Para probar:
1. Login como admin → navegar a /users → ver tabla con usuarios
2. Intentar navegar a /users como user1 → redirect a Dashboard
3. Cambiar rol de user1 a admin → toast de exito → ver reflejado en tabla
4. Desactivar user1 → modal de confirmacion → toast → badge cambia a Inactive
5. Intentar desactivarse a si mismo (admin) → error del backend "No puedes desactivarte a ti mismo"
6. Crear nuevo usuario desde modal → aparece en tabla
```

---

## 9. Checklist para Sesion 16

- [ ] Reescribir `UsersRolesPage.tsx` reemplazando la version inline
- [ ] Usar `useAdmin()` hook completo (incluir `cargar()` en useEffect)
- [ ] Agregar proteccion de ruta `user.rol === 'admin'` con redirect a `/`
- [ ] KPI cards: total, admins, activos, inactivos
- [ ] Filtros: busqueda (texto), rol (select all/admin/user), estado (select all/active/inactive)
- [ ] Boton "Clear filters" para resetear filtros
- [ ] Boton "Add User" para abrir modal de creacion
- [ ] Boton "Refresh" para recargar lista
- [ ] Tabla de usuarios con estilos Tailwind consistentes
- [ ] Badges de colores para rol (admin/user) y estado (active/inactive)
- [ ] Formatear fecha_creacion a formato legible
- [ ] Acciones: Toggle Role, Toggle Status (con modales de confirmacion)
- [ ] Modal de confirmacion reusable para acciones sensibles
- [ ] Modal de creacion de usuario (username, email, password, rol)
- [ ] Usar `register()` de api.ts para crear usuario (ya permite especificar rol para admin)
- [ ] Toast de feedback tras cada operacion (exito/error)
- [ ] Manejar error de backend "No puedes desactivarte a ti mismo"
- [ ] Estado vacio: "No users found"
- [ ] Loading state mientras `loading === true`
- [ ] Error state si `error !== null`
- [ ] TypeScript sin errores (`tsc -b --noEmit`)
- [ ] Build exitoso (`vite build`)
- [ ] Commit y push a GitHub

---

## 10. Notas adicionales

- **No es necesario modificar el backend** — todos los endpoints de autenticacion y admin ya estan implementados y funcionan.
- **No es necesario modificar `useAdmin.ts`** — el hook ya expone `cargar`, `cambiarRolUsuario`, `toggleUsuarioActivo`.
- **No es necesario modificar `api.ts`** — las funciones `register`, `listarUsuarios`, `cambiarRol`, `toggleActivo` ya existen.
- **No es necesario modificar `types.ts`** — las interfaces `Usuario` y `RegisterIn` ya existen.
- **No es necesario modificar `App.tsx`** — la ruta `/users` ya esta definida.
- **No es necesario modificar `Layout.tsx`** — el nav item ya existe.
- **El backend impide desactivarse a si mismo** (`if id == user["id"]: raise HTTPException(...)`). Manejar este error en el frontend mostrando un toast rojo.
- **El backend permite enviar `rol` en `register`** pero solo funciona si el request viene autenticado como admin. Esto ya esta manejado por el interceptor JWT en `api.ts`.

---

**Fin del contexto — Sesion 15 completada el 2026-04-27**
