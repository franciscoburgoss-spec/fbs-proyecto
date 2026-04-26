# FBS Sistema de Control de Documentos — Contexto Sesión 15

> **Fecha:** 2026-04-26  
> **Sesión anterior:** Sesión 14 — Transición de Proyectos en Timeline implementada  
> **Wireframe objetivo:** https://rlqb6bph7xrew.kimi.show/  
> **Repositorio:** https://github.com/franciscoburgoss-spec/fbs-proyecto  
> **Deploy actual:** https://tphfdoyzgcbs6.kimi.show  

---

## 1. Estado Actual del Proyecto (Post-Sesión 14)

### 1.1 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 18 + TypeScript + Tailwind CSS v4 + lucide-react + Vite + recharts |
| **Backend** | Python 3 + FastAPI + SQLite3 |
| **Auth** | JWT (login con username/password) |
| **Deploy** | Frontend estático + Backend local (puertos 5173/8000) |

### 1.2 Estructura de Directorios

```
fbs-proyecto/
├── backend/
│   ├── routers/              # auth.py, proyectos.py, documentos.py, eventos.py, reportes.py
│   ├── schemas/
│   ├── domain/
│   ├── registro.py          # emit_evento — guarda en SQLite + JSONL
│   ├── database.py
│   ├── main.py
│   └── data/app.db
├── frontend/
│   ├── src/
│   │   ├── components/       # 25+ componentes .tsx
│   │   │   ├── TasksPage.tsx         # PLACEHOLDER — "Feature coming soon"
│   │   │   ├── AuditoriaPage.tsx     # Existe pero con estilos inline básicos
│   │   │   ├── Dashboard.tsx         # Tiene toast, ProjectTimeline con transición
│   │   │   ├── ModulesPage.tsx       # Reportes con recharts
│   │   │   └── ...
│   │   ├── hooks/            # useAuth, useProyectos, useAuditoria, etc.
│   │   ├── context/          # AuthContext, ProyectoActivoContext
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

## 2. Funcionalidades IMPLEMENTADAS (Sesión 14)

### 2.1 Transición de Proyectos en Timeline — COMPLETADA

- `ProjectTimeline.tsx` ahora soporta clicks en la siguiente etapa inmediata
- `ProyectoTransicionModal.tsx` confirma avance de etapa (CHK→R1→R2→R3→APB)
- Integración en `Dashboard.tsx` con `useAuth` para restringir a admin
- Toast de éxito/error tras transición
- Refresco automático de datos (detalle + documentos)

---

## 3. Funcionalidad PENDIENTE (Sesión 15) — Auditoría de Eventos en /tasks

### 3.1 Descripción

La ruta `/tasks` actualmente muestra un placeholder vacío (`TasksPage.tsx` con "Feature coming soon"). El sidebar la lista como **"My Tasks"** (icono `LayoutGrid`) con comentario *"Vacio — Auditoria futura"*.

Se requiere implementar una **página de Auditoría de Eventos** profesional en `/tasks` que:

1. **Muestre el feed completo de eventos** del sistema (creación/actualización/eliminación de proyectos y documentos, transiciones)
2. **Solo sea visible para admin** — redirigir a `/` si el usuario no es admin
3. **Reutilice `useAuditoria.ts`** (ya implementado y funcional)
4. **Aplique estilos Tailwind consistentes** con el resto de la app (Dashboard, ModulesPage)
5. **Incluya filtros**: por tipo de evento, rango de fechas (desde/hasta), cantidad de resultados
6. **Muestre estadísticas** (KPI cards) con total de eventos y desglose por tipo
7. **Presente los eventos en una tabla** con badges de colores por categoría
8. **Opcional**: toggle para ver "Eventos globales" vs "Eventos del proyecto activo"

### 3.2 Backend disponible

El backend ya tiene todo implementado. Los eventos se registran automáticamente vía `emit_evento()` en cada operación CRUD y transición.

#### Endpoints existentes:

```python
# routers/eventos.py — ya implementado, solo admin
GET /api/eventos              # Lista eventos con filtros
GET /api/eventos/stats        # Stats agregadas (total + por_tipo)
GET /api/eventos/por-proyecto/{id}  # Eventos de un proyecto
```

#### Eventos que se registran (registro.py + routers):

| Evento | Descripción | Quién lo emite |
|--------|-------------|----------------|
| `proyecto_creado` | Nuevo proyecto creado | `proyectos.py` crear |
| `proyecto_actualizado` | Proyecto editado | `proyectos.py` actualizar |
| `proyecto_eliminado` | Proyecto borrado | `proyectos.py` eliminar |
| `proyecto_CHK→R1`, `R1→R2`, etc. | Transición de etapa | `proyectos.py` transicionar (via spec_engine) |
| `documento_creado` | Nuevo documento | `documentos.py` crear |
| `documento_actualizado` | Documento editado | `documentos.py` actualizar |
| `documento_eliminado` | Documento borrado | `documentos.py` eliminar |
| `documento_ING→OBS`, etc. | Transición de estado | `documentos.py` transicionar |

#### Schema EventoOut:

```python
class EventoOut(BaseModel):
    id: int
    timestamp: str          # ISO 8601
    event: str
    usuario_id: Optional[int] = None
    username: Optional[str] = None
    detalle: Optional[str] = None  # JSON serializado
```

#### Función emit_evento (registro.py):

```python
def emit_evento(event: str, **kwargs):
    """Guarda en archivo JSONL y en SQLite tabla 'eventos'."""
    # Extrae usuario_id, username, proyecto_id de kwargs
    # Inserta en SQLite: eventos(event, usuario_id, username, detalle, proyecto_id)
```

### 3.3 API ya disponible (api.ts)

```typescript
// Eventos / Auditoria
export const listarEventos = (params?: {
  event?: string; usuario_id?: number; desde?: string; hasta?: string;
  limit?: number; offset?: number;
}) => api.get<Evento[]>('/eventos', { params }).then(r => r.data)

export const obtenerStatsEventos = (params?: { desde?: string; hasta?: string }) =>
  api.get<{ total: number; por_tipo: { event: string; count: number }[] }>('/eventos/stats', { params }).then(r => r.data)

export const listarEventosPorProyecto = (proyecto_id: number) =>
  api.get<Evento[]>(`/eventos/por-proyecto/${proyecto_id}`).then(r => r.data)
```

**Hook `useAuditoria.ts`** ya expone todo:

```typescript
const { eventos, stats, loading, error, cargar } = useAuditoria()
// cargar(filtros, limit, offset) — carga eventos + stats en paralelo
```

---

## 4. Código Relevante Completo

### 4.1 TasksPage.tsx (ACTUAL — placeholder)

```tsx
// src/components/TasksPage.tsx
export default function TasksPage() {
  return (
    <div style={{ textAlign: 'center', padding: 64 }}>
      <h1 style={{ margin: '0 0 16px', fontSize: 24, fontWeight: 600, color: '#111827' }}>
        My Tasks
      </h1>
      <p style={{ color: '#9ca3af', fontSize: 16 }}>Feature coming soon</p>
    </div>
  )
}
```

### 4.2 AuditoriaPage.tsx (EXISTENTE — estilos inline básicos)

```tsx
// src/components/AuditoriaPage.tsx — ya existe pero no está en rutas
import { useEffect, useState } from 'react'
import { useAuditoria } from '../hooks/useAuditoria'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const EVENT_TYPES = [
  'proyecto_creado', 'proyecto_actualizado', 'proyecto_eliminado',
  'documento_creado', 'documento_actualizado', 'documento_eliminado',
]

export default function AuditoriaPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { eventos, stats, loading, error, cargar } = useAuditoria()
  const [filtroEvento, setFiltroEvento] = useState('')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')
  const [limit, setLimit] = useState(100)

  useEffect(() => {
    if (user && user.rol !== 'admin') { navigate('/') }
  }, [user, navigate])

  useEffect(() => {
    if (user?.rol === 'admin') {
      cargar({ event: filtroEvento || undefined, desde: filtroDesde || undefined, hasta: filtroHasta || undefined }, limit)
    }
  }, [user, cargar, filtroEvento, filtroDesde, filtroHasta, limit])

  if (!user || user.rol !== 'admin') return null
  // ... render tabla inline con filtros y stats
}
```

### 4.3 useAuditoria.ts (hook ya implementado)

```typescript
// src/hooks/useAuditoria.ts
import { useState, useCallback } from 'react'
import { listarEventos, obtenerStatsEventos } from '../api'
import type { Evento } from '../types'

interface FiltrosEvento {
  event?: string
  usuario_id?: number
  desde?: string
  hasta?: string
}

export function useAuditoria() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [stats, setStats] = useState<{ total: number; por_tipo: { event: string; count: number }[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async (filtros: FiltrosEvento = {}, limit = 100, offset = 0) => {
    setLoading(true)
    setError(null)
    try {
      const [data, statsData] = await Promise.all([
        listarEventos({ ...filtros, limit, offset }),
        obtenerStatsEventos({ desde: filtros.desde, hasta: filtros.hasta }),
      ])
      setEventos(data)
      setStats(statsData)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al cargar eventos')
    } finally {
      setLoading(false)
    }
  }, [])

  return { eventos, stats, loading, error, cargar }
}
```

### 4.4 api.ts (funciones de eventos)

```typescript
// src/api.ts
export const listarEventos = (params?: { event?: string; usuario_id?: number; desde?: string; hasta?: string; limit?: number; offset?: number }) =>
  api.get<Evento[]>('/eventos', { params }).then(r => r.data)

export const obtenerStatsEventos = (params?: { desde?: string; hasta?: string }) =>
  api.get<{ total: number; por_tipo: { event: string; count: number }[] }>('/eventos/stats', { params }).then(r => r.data)

export const listarEventosPorProyecto = (proyecto_id: number) =>
  api.get<Evento[]>(`/eventos/por-proyecto/${proyecto_id}`).then(r => r.data)
```

### 4.5 types.ts (interfaces)

```typescript
export interface Evento {
  id: number
  timestamp: string
  event: string
  usuario_id: number | null
  username: string | null
  detalle: string | null
  fecha_creacion: string
}

export interface Usuario {
  id: number
  username: string
  email: string
  rol: 'admin' | 'user'
  activo: boolean
  fecha_creacion: string
}
```

### 4.6 App.tsx (rutas)

```tsx
// src/App.tsx
<Route path="/tasks" element={<TasksPage />} />
// No hay ruta /auditoria — la auditoria debe ir en /tasks
```

### 4.7 Layout.tsx (nav item)

```tsx
const navItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/modules', label: 'Modules', icon: Folder },
  { to: '/tasks', label: 'My Tasks', icon: LayoutGrid },   // ← Aquí va Auditoría
  { to: '/users', label: 'Users & Roles', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
]
```

### 4.8 AuthContext.tsx / useAuth.ts

```tsx
// useAuth() retorna { user, token, loading, error, login, register, logout, clearError }
// user.rol es 'admin' | 'user'
```

---

## 5. Patrones de UI Establecidos (copiar exactamente)

### 5.1 Page Header

```
<div className="flex justify-between items-center mb-6">
  <div>
    <h1 className="text-lg font-semibold text-[#111827]">Page Title</h1>
    <p className="text-[13px] text-[#9ca3af] mt-1">Subtitle description</p>
  </div>
</div>
```

### 5.2 KPI Cards (como en ModulesPage)

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

### 5.4 Badge de colores por evento

```
Crear/éxito:    bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]
Actualizar:     bg-[#eff6ff] text-[#1e40af] border border-[#bfdbfe]
Eliminar/peligro: bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]
Transición:     bg-[#fffbeb] text-[#92400e] border border-[#fde68a]
```

### 5.5 Filtros inline

```
Contenedor: flex items-center gap-3 mb-4 flex-wrap
Select:     px-3 py-2 rounded-md border border-[#e5e7eb] bg-white text-[13px] text-[#374151]
Input date: px-3 py-2 rounded-md border border-[#e5e7eb] bg-white text-[13px]
Botón:      px-4 py-2 rounded-md border border-[#e5e7eb] bg-white text-[13px] hover:bg-[#f9fafb]
```

### 5.6 Toast

```tsx
const [toast, setToast] = useState<string | null>(null)
// Verde: bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46]
// Rojo:  bg-[#fef2f2] border border-[#fecaca] text-[#991b1b]
```

### 5.7 Iconos (lucide-react) para Auditoría

```tsx
import {
  LayoutGrid, Activity, Calendar, Filter, RefreshCw,
  ChevronLeft, ChevronRight, AlertCircle, FileText, FolderOpen,
  ArrowRightLeft, User, Clock
} from 'lucide-react'
```

---

## 6. Plan de Implementación — Auditoría de Eventos

### Paso 1: Crear hook `useEventosProyecto` (opcional)

Si se quiere toggle "Global / Proyecto Actual":

```tsx
// Nuevo hook o extender useAuditoria para aceptar proyecto_id
// Si proyecto_id está presente, usa listarEventosPorProyecto en vez de listarEventos
```

### Paso 2: Reescribir TasksPage.tsx

Reemplazar el placeholder por una página completa de Auditoría:

1. **Header**: "Audit Log" / "System Events" con subtítulo
2. **KPI Cards**: Total Events + cards por tipo de evento (usar `stats.por_tipo`)
3. **Filtros**: Select de tipo de evento, datetime-local desde/hasta, select de límite (50/100/250), botón Limpiar
4. **Tabla**: ID | Timestamp | Event (badge) | User | Detail
5. **Empty state**: "No events found" cuando no hay datos
6. **Loading**: spinner o skeleton mientras `loading` es true
7. **Error**: banner rojo si `error` no es null

### Paso 3: Protección de ruta (solo admin)

```tsx
useEffect(() => {
  if (user && user.rol !== 'admin') {
    navigate('/')
  }
}, [user, navigate])
```

### Paso 4: Colores de badges por tipo de evento

Mapear eventos a categorías visuales:

```tsx
const getEventColor = (event: string) => {
  if (event.includes('creado')) return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' }
  if (event.includes('eliminado')) return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' }
  if (event.includes('actualizado')) return { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' }
  if (event.includes('transicion')) return { bg: '#fffbeb', text: '#92400e', border: '#fde68a' }
  return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' }
}
```

### Paso 5: Parsear detalle JSON

El campo `detalle` es un string JSON. Mostrar campos clave si existen:

```tsx
const parseDetalle = (detalle: string | null) => {
  if (!detalle) return '-'
  try {
    const obj = JSON.parse(detalle)
    return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(', ')
  } catch { return detalle }
}
```

### Paso 6: Formatear timestamp

```tsx
const fmtDate = (ts: string) =>
  new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
```

---

## 7. Pseudocódigo de la implementación

### TasksPage.tsx (nueva versión)

```tsx
export default function TasksPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { eventos, stats, loading, error, cargar } = useAuditoria()
  const [filtroEvento, setFiltroEvento] = useState('')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')
  const [limit, setLimit] = useState(100)

  // Proteger ruta
  useEffect(() => {
    if (user && user.rol !== 'admin') navigate('/')
  }, [user, navigate])

  // Cargar datos
  useEffect(() => {
    if (user?.rol === 'admin') cargar({...}, limit)
  }, [filtroEvento, filtroDesde, filtroHasta, limit])

  if (!user || user.rol !== 'admin') return null

  return (
    <div>
      {/* Header */}
      {/* Stats Cards */}
      {/* Filters */}
      {/* Table */}
    </div>
  )
}
```

---

## 8. Datos de prueba

```
Usuarios:
- admin / admin123 (rol: admin) ← puede ver /tasks (Auditoría)
- user1 / user123 (rol: user)   ← redirigido a Dashboard al entrar a /tasks

Eventos esperados en DB (ya generados por operaciones previas):
- proyecto_creado (al crear proyectos de prueba)
- proyecto_transicion (al avanzar etapas en Sesión 14)
- documento_creado (al crear documentos)
- documento_transicion (al cambiar estado ING→OBS→COR→APB)
```

---

## 9. Checklist para Sesión 15

- [ ] Reescribir `TasksPage.tsx` reemplazando el placeholder
- [ ] Usar `useAuditoria()` hook (ya existe, no modificar)
- [ ] Agregar protección de ruta `user.rol === 'admin'` con redirect a `/`
- [ ] KPI cards con `stats.total` y `stats.por_tipo`
- [ ] Filtros: tipo de evento (select), fecha desde/hasta (datetime-local), límite (select 50/100/250)
- [ ] Botón "Clear filters" para resetear filtros
- [ ] Tabla de eventos con estilos Tailwind consistentes
- [ ] Badges de colores por categoría de evento (creado/actualizado/eliminado/transición)
- [ ] Formatear timestamp a formato legible
- [ ] Parsear campo `detalle` JSON si existe
- [ ] Estado vacío: "No events found"
- [ ] Loading state mientras `loading === true`
- [ ] Error state si `error !== null`
- [ ] TypeScript sin errores (`tsc -b --noEmit`)
- [ ] Build exitoso (`vite build`)
- [ ] Deploy

---

## 10. Notas adicionales

- **No es necesario modificar el backend** — todos los endpoints de eventos ya están implementados y funcionan.
- **No es necesario modificar `useAuditoria.ts`** — el hook ya hace todo lo necesario (carga eventos + stats en paralelo).
- **No es necesario modificar `api.ts`** — las funciones de eventos ya existen.
- **Si se desea**, se puede agregar paginación con `offset` en el hook `useAuditoria`, pero para MVP basta con el selector de `limit` (50/100/250).
- **Icono del sidebar**: Mantener `LayoutGrid` para `/tasks` (no cambiar el nav). El label "My Tasks" puede mantenerse o cambiarse a "Audit Log" si se prefiere, pero no es obligatorio.

---

**Fin del contexto — Sesión 14 completada el 2026-04-26**
