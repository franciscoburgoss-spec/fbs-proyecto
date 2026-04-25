# FBS Sistema de Control de Documentos — Contexto Sesión 13

> **Fecha:** 2026-04-25  
> **Sesión anterior:** Sesión 12 — CRUD completo (crear/editar/eliminar proyectos y documentos)  
> **Wireframe objetivo:** https://rlqb6bph7xrew.kimi.show/  
> **Repositorio:** https://github.com/franciscoburgoss-spec/fbs-proyecto  

---

## 1. Estado Actual del Proyecto

### 1.1 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 18 + TypeScript + Tailwind CSS v4 + lucide-react + Vite |
| **Backend** | Python 3 + FastAPI + SQLite3 |
| **Auth** | JWT (login con username/password) |
| **Deploy** | Frontend estático + Backend local (puertos 5173/8000) |

### 1.2 Estructura de Directorios

```
fbs-proyecto/
├── backend/                  # Python FastAPI
│   ├── routers/              # auth.py, proyectos.py, documentos.py, eventos.py, reportes.py
│   ├── schemas/              # pydantic models
│   ├── domain/               # lógica de negocio (validadores)
│   ├── database.py           # SQLite + seed_data()
│   ├── main.py               # entry point FastAPI
│   └── data/
│       └── app.db            # base de datos SQLite
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── components/       # 25 componentes .tsx
│   │   ├── hooks/            # 10 custom hooks
│   │   ├── context/          # AuthContext, ProyectoActivoContext
│   │   ├── api.ts            # funciones axios
│   │   └── types.ts          # interfaces TypeScript
│   ├── dist/                 # build estático
│   ├── tailwind.config.js    # Tailwind v4
│   ├── postcss.config.js     # @tailwindcss/postcss
│   └── package.json
└── scripts/
    └── start.sh              # arranca backend + frontend
```

---

## 2. Funcionalidades IMPLEMENTADAS (Sesión 12)

### 2.1 Frontend — Componentes existentes

| Componente | Función |
|-----------|---------|
| **Layout.tsx** | Sidebar (w-[240px]) + Header con breadcrumb, ProjectSelector, Edit Project, icon buttons |
| **Dashboard.tsx** | Layout 2 columnas: DocumentTable (izq) + sidebar derecha (Timeline + Traceability + QuickActions) |
| **DocumentTable.tsx** | grid-cols-12 con: Document ID, Title, Module badge, Status pill, Last Update, Actions dropdown |
| **ProjectTimeline.tsx** | Cajas CHK→R1→R2→R3→APB con checkmarks y flechas |
| **TraceabilitySummary.tsx** | Grid 2 cols Module A/B/C con Approved/Pending |
| **QuickActions.tsx** | Upload New Document, Generate Report, New Project |
| **ProjectSelector.tsx** | Dropdown custom con ChevronDown de lucide |
| **TransitionModal.tsx** | Modal 2 pasos: seleccionar transición → confirmar (+ observación si aplica) |
| **NuevoProyectoModal.tsx** | Form: Nombre, Acrónimo, Descripción, Cliente, Ubicación |
| **NuevoDocumentoModal.tsx** | Form: Nombre, Módulo (select), Tipo, TT, NN |
| **EditarProyectoModal.tsx** | Editar: Nombre, Descripción, Cliente, Ubicación (acrónimo no editable) |
| **EditarDocumentoModal.tsx** | Editar: Nombre, Tipo, TT, NN (módulo/etapa no editables) |
| **LoginPage.tsx** | Username + password con JWT |
| **AdminPage.tsx** | Lista de usuarios (solo admin) |
| **ExportButton.tsx** | Exporta a CSV |

### 2.2 Interacciones implementadas

| Interacción | Estado |
|------------|--------|
| Click en fila de documento → expande (chevron rotate 90deg) | ✅ |
| Expanded: Transition History + Available Transitions | ✅ |
| Available Transitions: siempre visible, "Terminal state" para APB | ✅ |
| Botones transición: pill blanco con pills individuales desde/hacia | ✅ |
| ⋮ dropdown en cada fila: Transition / Edit / Delete | ✅ |
| Modal de transición multi-paso | ✅ |
| Toast de notificación (verde éxito, rojo error) | ✅ |
| Refetch automático tras CRUD | ✅ |
| Cambio de proyecto desde dropdown | ✅ |

### 2.3 Backend — Endpoints ya implementados

| Router | Endpoints | Auth |
|--------|-----------|------|
| **auth** | POST /login, POST /register, GET /me, GET /users, PATCH /users/{id}/rol, PATCH /users/{id}/activar, PATCH /me, POST /password | requiere_auth / require_admin |
| **proyectos** | GET /, GET /{id}, GET /{id}/detail, POST /, PATCH /{id}, DELETE /{id}, POST /{id}/transicion | requiere_auth (POST/PATCH/DELETE admin) |
| **documentos** | GET /, GET /{id}, POST /, PATCH /{id}, DELETE /{id}, POST /{id}/transicion | requiere_auth (POST/PATCH/DELETE admin) |
| **eventos** | GET /, GET /stats, GET /por-proyecto/{id} | **require_admin** |
| **reportes** | GET /proyectos, GET /documentos, GET /general, GET /export/csv | requiere_auth |

---

## 3. Funcionalidades PENDIENTES (Sesión 13)

### 3.1 Gestión de Usuarios (Users & Roles)

**Página:** `/users` (ruta ya existe en App.tsx pero el componente UsersRolesPage.tsx está vacío)

**Backend disponible:**
- `GET /api/auth/users` → lista usuarios (admin only)
- `PATCH /api/auth/users/{id}/rol` → body: `{"rol": "admin"|"user"}`
- `PATCH /api/auth/users/{id}/activar` → body: `{"activo": true|false}`

**UI necesaria:**
- Tabla de usuarios: username, email, rol, activo, fecha
- Toggle para activar/desactivar usuario
- Select para cambiar rol (admin/user)
- Badge de rol (admin=azul, user=gris)

**Hook existente:** `useAdmin.ts` → ya usa `listarUsuariosAdmin()`

---

### 3.2 Auditoría / Eventos (My Tasks → renombrar o nueva página)

**Página:** `/tasks` actualmente vacío, o nueva ruta `/auditoria`

**Backend disponible:**
- `GET /api/eventos` → lista eventos con filtros: event, usuario_id, desde, hasta, limit, offset
- `GET /api/eventos/stats` → estadísticas agregadas: total, por_tipo
- `GET /api/eventos/por-proyecto/{proyecto_id}` → eventos de un proyecto

**Esquema Evento (SQLite):**
```sql
id, event, usuario_id, proyecto_id, documento_id, modulo, etapa, timestamp
```

**UI necesaria:**
- Tabla de eventos: timestamp, evento, usuario, proyecto, documento
- Filtros: por tipo de evento, rango de fechas, usuario
- Stats cards: Total eventos, por tipo (gráfico simple)
- **Solo visible para admin** (usar `user.rol === 'admin'`)

---

### 3.3 Reportes (Modules → renombrar)

**Página:** `/modules` actualmente vacío, ideal para Reportes

**Backend disponible:**
- `GET /api/reportes/proyectos` → total, por_etapa, por_cliente, recientes
- `GET /api/reportes/documentos?proyecto_id=X` → total, por_estado, por_modulo, por_etapa, observaciones_pendientes, por_modulo_estado
- `GET /api/reportes/general` → totales, doc_por_estado, proj_por_etapa, evolucion_mensual
- `GET /api/reportes/export/csv?entidad=proyectos|documentos` → descarga CSV

**UI necesaria:**
- Cards KPI: Total proyectos, total documentos, total usuarios, total eventos
- Gráficos (usar recharts que ya está instalado):
  - Pie chart: documentos por estado
  - Bar chart: proyectos por etapa
  - Line chart: evolución de proyectos por mes
- Tabla de observaciones pendientes (documentos OBS)
- Botón "Export CSV" que descarga realmente el archivo

**Hook existente:** `useReportes.ts`, `useStats.ts`

---

### 3.4 Transición de Proyectos (cambiar etapa CHK→R1→R2→R3)

**Backend disponible:**
- `POST /api/proyectos/{id}/transicion` → body: `{"nueva_etapa": "R1"}`
- Transiciones válidas: CHK→R1→R2→R3 (lineal)

**UI necesaria:**
- En ProjectTimeline, hacer que las cajas de etapas futuras sean clickeables
- Modal de confirmación al avanzar etapa
- Validación: solo puede avanzar una etapa a la vez
- Evento automático registrado en auditoría

---

### 3.5 Mejoras del Perfil de Usuario

**Página:** `/settings` o modal

**Backend disponible:**
- `PATCH /api/auth/me` → body: `{"email": "...", "username": "..."}`
- `POST /api/auth/password` → body: `{"old_password": "...", "new_password": "..."}`

**UI necesaria:**
- Formulario de perfil: username, email (no editable?), cambiar contraseña

---

### 3.6 Dashboard mejorado (KPIs reales)

**Actualmente:** El dashboard solo muestra documentos del proyecto activo.

**Backend `/api/reportes/general` devuelve:**
```json
{
  "totales": { "proyectos": 3, "documentos": 17, "usuarios": 2, "eventos": 50 },
  "documentos_por_estado": [{"estado": "APB", "count": 8}, ...],
  "proyectos_por_etapa": [{"etapa_actual": "CHK", "count": 1}, ...],
  "evolucion_proyectos": [{"mes": "2025-04", "count": 2}, ...]
}
```

**UI necesaria:**
- Cards en la parte superior del Dashboard con KPIs
- Gráficos con recharts

---

## 4. Arquitectura Frontend — Patrones establecidos

### 4.1 Convenciones de código (APRENDER DE LA SESIÓN 12)

```
# Todos los componentes usan Tailwind CSS con clases exactas del wireframe:

# Layout sidebar botón activo:
className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-lg transition-colors bg-white text-[#1f2937] shadow-sm border border-[#e5e7eb]"

# Layout sidebar botón inactivo:
className="text-[#6b7280] hover:text-[#374151] hover:bg-[#f0f1f3]"

# Document table row:
className="grid grid-cols-12 gap-3 px-4 py-3 items-center cursor-pointer hover:bg-[#fafafa] transition-colors"

# Module badge (no border, rounded-full):
className="inline-flex items-center justify-center rounded-full text-[11px] font-medium px-2 py-0.5"

# Status pill (with border, rounded-md):
className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border"

# Modal overlay:
className="fixed inset-0 bg-black/35 flex items-center justify-center z-[1000]"

# Modal card:
className="bg-white rounded-lg min-w-[420px] max-w-[480px] shadow-xl overflow-hidden"

# Modal header:
className="px-6 py-5 border-b border-[#e5e7eb] flex items-start justify-between"

# Modal footer:
className="px-6 py-4 border-t border-[#e5e7eb] flex justify-end gap-2.5"
```

### 4.2 Iconos disponibles (lucide-react)

```tsx
import { Home, FileText, Folder, LayoutGrid, Users, Settings, Search, Bell, User, ChevronRight, Lock, MoreHorizontal, CircleCheck, Circle, RefreshCw, Ban, Upload, BarChart3, Plus, X } from 'lucide-react'
```

### 4.3 Colores exactos del wireframe

| Elemento | Color |
|----------|-------|
| Fondo página | `#f8f9fa` |
| Bordes | `#e5e7eb` |
| Texto principal | `#111827` |
| Texto secundario | `#6b7280` |
| Texto terciario | `#9ca3af` |
| Botón primario (negro) | `#111827` bg, `#fff` text |
| Estado APB (verde) | `bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]` |
| Estado ING (azul) | `bg-[#eff6ff] text-[#3b82f6] border-[#bfdbfe]` |
| Estado COR (ámbar) | `bg-[#fffbeb] text-[#f59e0b] border-[#fde68a]` |
| Estado OBS (rojo) | `bg-[#fef2f2] text-[#ef4444] border-[#fecaca]` |
| Module EST (azul) | `bg-[#eff6ff] text-[#2563eb]` |
| Module HAB (verde) | `bg-[#f0fdf4] text-[#16a34a]` |
| Module MDS (ámbar) | `bg-[#fffbeb] text-[#d97706]` |

### 4.4 API functions (api.ts)

```typescript
// Proyectos
export const listarProyectos = () => api.get('/api/proyectos')
export const obtenerProyecto = (id: number) => api.get(`/api/proyectos/${id}`)
export const crearProyecto = (data: ProyectoIn) => api.post('/api/proyectos', data)
export const actualizarProyecto = (id: number, data: Record<string, string>) => api.patch(`/api/proyectos/${id}`, data)
export const eliminarProyecto = (id: number) => api.delete(`/api/proyectos/${id}`)
export const transicionarProyecto = (id: number, nuevaEtapa: string) => api.post(`/api/proyectos/${id}/transicion`, { nueva_etapa: nuevaEtapa })

// Documentos
export const listarDocumentos = (params?: Record<string, unknown>) => api.get('/api/documentos', { params })
export const obtenerDocumento = (id: number) => api.get(`/api/documentos/${id}`)
export const crearDocumento = (proyectoId: number, data: DocumentoIn) => api.post(`/api/documentos?proyecto_id=${proyectoId}`, data)
export const actualizarDocumento = (id: number, data: Record<string, string>) => api.patch(`/api/documentos/${id}`, data)
export const eliminarDocumento = (id: number) => api.delete(`/api/documentos/${id}`)
export const transicionarDocumento = (id: number, nuevoEstado: string, payload: Record<string, string> = {}) => api.post(`/api/documentos/${id}/transicion`, { nuevo_estado: nuevoEstado, ...payload })

// Auth
export const login = (username: string, password: string) => api.post('/api/auth/login', { username, password })
export const register = (username: string, password: string, email?: string) => api.post('/api/auth/register', { username, password, email })
export const obtenerUsuario = () => api.get('/api/auth/me')
export const listarUsuariosAdmin = () => api.get('/api/auth/users')
export const cambiarRolUsuario = (id: number, rol: string) => api.patch(`/api/auth/users/${id}/rol`, { rol })
export const activarUsuario = (id: number, activo: boolean) => api.patch(`/api/auth/users/${id}/activar`, { activo })
export const actualizarPerfil = (data: Record<string, string>) => api.patch('/api/auth/me', data)
export const cambiarPassword = (oldPassword: string, newPassword: string) => api.post('/api/auth/password', { old_password: oldPassword, new_password: newPassword })

// Eventos (admin only)
export const listarEventos = (params?: Record<string, unknown>) => api.get('/api/eventos', { params })
export const obtenerStatsEventos = () => api.get('/api/eventos/stats')

// Reportes
export const obtenerReporteProyectos = () => api.get('/api/reportes/proyectos')
export const obtenerReporteDocumentos = (proyectoId?: number) => api.get('/api/reportes/documentos', { params: proyectoId ? { proyecto_id: proyectoId } : undefined })
export const obtenerReporteGeneral = () => api.get('/api/reportes/general')
export const exportarCSV = (entidad: 'proyectos' | 'documentos') => api.get(`/api/reportes/export/csv?entidad=${entidad}`, { responseType: 'blob' })
```

### 4.5 Types (types.ts)

```typescript
export interface Proyecto {
  id: number
  nombre: string
  acronimo: string
  descripcion?: string
  etapa_actual: string
  cliente?: string
  ubicacion?: string
  fecha_creacion: string
}

export interface Documento {
  id: number
  proyecto_id: number
  nombre: string
  modulo: 'EST' | 'HAB' | 'MDS'
  etapa: 'CHK' | 'R1' | 'R2' | 'R3'
  estado: 'ING' | 'OBS' | 'COR' | 'APB'
  tipo: string
  tt: string
  nn: string
  observacion?: string
  fecha_creacion: string
  fecha_modificacion: string
}

export interface Evento {
  id: number
  event: string
  usuario_id?: number
  proyecto_id?: number
  documento_id?: number
  modulo?: string
  etapa?: string
  timestamp: string
}

export interface Usuario {
  id: number
  username: string
  email?: string
  rol: 'admin' | 'user'
  activo: boolean
  fecha_creacion: string
}

export interface ProyectoIn {
  nombre: string
  acronimo: string
  descripcion?: string
  cliente?: string
  ubicacion?: string
}

export interface DocumentoIn {
  nombre: string
  modulo: 'EST' | 'HAB' | 'MDS'
  tipo: string
  tt: string
  nn: string
}
```

---

## 5. Hooks existentes

| Hook | Función | Estado |
|------|---------|--------|
| `useAuth.ts` | login, logout, user, token | ✅ Listo |
| `useProyectos.ts` | listar, cargar detalle | ✅ Listo |
| `useDocumentos.ts` | listar con filtros | ✅ Listo |
| `useProyectoDetail.ts` | detalle completo del proyecto | ✅ Listo |
| `useTraceability.ts` | resumen por módulo | ✅ Listo |
| `useAdmin.ts` | listar usuarios (admin) | ✅ Listo |
| `useAuditoria.ts` | listar eventos (admin) | ⚠️ Existe pero no se usa |
| `useReportes.ts` | obtener reportes | ⚠️ Existe pero no se usa |
| `useStats.ts` | estadísticas | ⚠️ Existe pero no se usa |

---

## 6. Rutas en App.tsx

```tsx
<Route path="/" element={<Dashboard />} />
<Route path="/documents" element={<DocumentsPage />} />
<Route path="/modules" element={<ModulesPage />} />     {/* Vacío - ideal para Reportes */}
<Route path="/tasks" element={<TasksPage />} />         {/* Vacío - ideal para Auditoría */}
<Route path="/users" element={<UsersRolesPage />} />    {/* Vacío - Users & Roles */}
<Route path="/settings" element={<SettingsPage />} />   {/* Vacío - Perfil */}
```

---

## 7. Plan de implementación sugerido (Sesión 13)

### Prioridad ALTA

1. **Página de Reportes** (`/modules`)
   - Usar `useReportes` + `useStats`
   - Cards KPI + gráficos recharts
   - Tabla observaciones pendientes
   - Botón Export CSV funcional

2. **Transición de Proyectos** (en ProjectTimeline)
   - Hacer cajas clickeables
   - Modal confirmación
   - `transicionarProyecto()`

### Prioridad MEDIA

3. **Página de Auditoría** (`/tasks` o nueva `/auditoria`)
   - Solo visible para admin
   - Tabla de eventos con filtros
   - Stats de eventos

4. **Página Users & Roles** (`/users`)
   - Tabla de usuarios
   - Toggle activo/inactivo
   - Select cambiar rol

### Prioridad BAJA

5. **Página de Perfil** (`/settings`)
   - Formulario de perfil
   - Cambiar contraseña

6. **Dashboard con KPIs**
   - Integrar `/api/reportes/general`
   - Gráficos recharts

---

## 8. Wireframe de referencia

**URL:** https://rlqb6bph7xrew.kimi.show/

El wireframe muestra las siguientes páginas navegables:
- **Dashboard** `/` — Documentos del proyecto activo + sidebar derecho
- **Documents** `/documents` — Lista de documentos (similar a Dashboard)
- **Modules** `/modules` — **Vacío en wireframe pero debe tener reportes**
- **My Tasks** `/tasks` — **Vacío en wireframe pero debe tener auditoría**
- **Users & Roles** `/users` — **Vacío en wireframe pero debe tener gestión de usuarios**
- **Settings** `/settings` — **Vacío en wireframe pero debe tener perfil**

---

## 9. Notas importantes para continuar

### 9.1 Tailwind CSS v4
El proyecto usa Tailwind v4 con la sintaxis `@import "tailwindcss"` en `src/index.css`. No usar `@tailwind` directives (eso es v3). Los plugins están en `postcss.config.js` con `@tailwindcss/postcss`.

### 9.2 Iconos
**NUNCA** usar emojis. Siempre usar `lucide-react` con clases exactas:
```tsx
<Home className="w-[18px] h-[18px] shrink-0 text-[#4b5563]" strokeWidth={2} />
```

### 9.3 Responsive
El wireframe no es responsive — diseñado para desktop 1280px+. Mantener ancho fijo sidebar `w-[240px]` y panel derecho `w-80`.

### 9.4 Toast notifications
Usar el patrón establecido en Dashboard.tsx:
```tsx
const [toast, setToast] = useState<string | null>(null)
// Mostrar:
setToast('Mensaje')
setTimeout(() => setToast(null), 3000)
```

### 9.5 Modal pattern
Todos los modales deben seguir la estructura:
- Overlay: `fixed inset-0 bg-black/35 z-[1000]`
- Card: `bg-white rounded-lg shadow-xl overflow-hidden`
- Header: `px-6 py-5 border-b border-[#e5e7eb]`
- Body: `px-6 py-5`
- Footer: `px-6 py-4 border-t border-[#e5e7eb]`

### 9.6 Admin-only pages
Verificar `user.rol === 'admin'` antes de mostrar páginas de admin. Los endpoints ya requieren `require_admin` y devolverán 403.

---

## 10. Datos de prueba actuales (para testing)

```
Usuarios:
- admin / admin123 (rol: admin)
- user1 / user123 (rol: user)

Proyectos:
- Proyecto Norte (PN-2025) — R2 — 5 docs
- Proyecto Sur (PS-2025) — R1 — 6 docs
- Proyecto Central (PC-2025) — CHK — 6 docs

Documentos: 17 totales, estados variados (ING, OBS, COR, APB)
```

---

## 11. Checklist para nueva sesión

- [ ] Leer este archivo completo
- [ ] Revisar wireframe: https://rlqb6bph7xrew.kimi.show/
- [ ] Verificar `git log` por commits recientes
- [ ] Ejecutar `./scripts/start.sh` para probar localmente
- [ ] Verificar build: `cd frontend && npx tsc --noEmit && npx vite build`
- [ ] Implementar funcionalidades pendientes según prioridad
- [ ] Hacer deploy con `mshtools-deploy_website` (static)
- [ ] Commit + push a GitHub

---

**Fin del contexto — Sesión 12 completada el 2026-04-25**
