# Contexto Sesion 8 -- Vista Detallada de Proyecto y Mejoras de UX

> **Hardware:** MacBook Air 7,2 * 8GB RAM * 128GB SSD * Python 3.11+ nativo
> **Objetivo:** Crear una pagina de detalle completa para cada proyecto, con sus documentos, estadisticas, timeline de eventos, y mejorar la navegacion desde las listas.
> **Tiempo estimado:** 2-3 horas.

---

## Paso previo obligatorio

Clonar el repositorio actualizado con las sesiones 1-7:

```bash
git clone https://github.com/franciscoburgoss-spec/fbs-proyecto.git
cd fbs-proyecto
```

**NO modificar** los archivos existentes del backend (`main.py`, `database.py`, `routers/` salvo los indicados, `schemas/`, `domain/`, `middleware/`, `tests/` salvo los indicados) ni del frontend (salvo los explicitos).

---

## Estado previo (sesiones 1-7 en main)

- `spec_engine/` -- Motor de especificaciones completo
- `specs/` -- `documento.yaml`, `proyecto.yaml` con maquinas de estado
- `backend/` -- FastAPI v1.4.0 con CORS, routers CRUD + transiciones + auth JWT + roles + perfil + auditoria + reportes, middleware de errores, 111 tests
  - `auth.py` -- Login, registro, `/me`, `require_auth`, `require_admin`, gestion usuarios, perfil
  - `eventos.py` -- Router de auditoria con filtros, paginacion y estadisticas
  - `registro.py` -- `emit_evento()` guarda eventos en archivo JSONL y SQLite
  - `reportes.py` -- Endpoints de estadisticas agregadas (`/general`, `/proyectos`, `/documentos`, `/export/csv`)
- `frontend/` -- React + TypeScript, Vite, Dashboard con graficos Recharts, CRUD, hooks, Layout, LoginPage, AuthContext, AdminPage, PerfilPage, AuditoriaPage, ExportButton
- `docker-compose.yml` -- Backend + Frontend + JWT_SECRET

---

## Archivos a crear en esta sesion

```
backend/
  routers/
    (no se crean nuevos routers, se extiende proyectos.py)
  tests/
    test_api_proyecto_detalle.py   # Tests del endpoint de detalle
frontend/src/
  components/
    ProyectoDetail.tsx             # Pagina de detalle completa de un proyecto
  hooks/
    useProyectoDetail.ts           # Hook para cargar datos del detalle
```

## Archivos a modificar

```
backend/routers/proyectos.py           # Agregar endpoint GET /{id}/detail
backend/routers/eventos.py             # Agregar endpoint GET /por-proyecto/{proyecto_id}
frontend/src/App.tsx                   # Agregar ruta /proyectos/:id
frontend/src/components/ProyectoList.tsx   # Agregar links a detalle, badges de documentos
frontend/src/components/DocumentoList.tsx  # Agregar filtro por proyecto_id via query param
frontend/src/api.ts                    # Agregar funciones de detalle y eventos por proyecto
frontend/src/types.ts                  # Agregar interfaces ProyectoDetail, TimelineEvento
backend/main.py                        # (sin cambios, v1.4.0)
backend/routers/__init__.py            # (sin cambios)
```

---

## 1. backend/routers/proyectos.py -- AGREGAR endpoint

Agregar despues del endpoint `obtener_proyecto` y antes de `crear_proyecto`:

```python
@router.get("/{id}/detail")
def obtener_proyecto_detalle(id: int, user: dict = Depends(require_auth)):
    """Devuelve proyecto completo con sus documentos, estadisticas y eventos recientes."""
    with get_conn() as conn:
        # Proyecto
        row = conn.execute("SELECT * FROM proyectos WHERE id = ?", (id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="proyecto no encontrado")
        proyecto = dict(row)

        # Documentos del proyecto
        documentos = conn.execute(
            "SELECT * FROM documentos WHERE proyecto_id = ? ORDER BY modulo, etapa, nombre",
            (id,),
        ).fetchall()

        # Estadisticas de documentos
        stats_docs = conn.execute(
            "SELECT estado, COUNT(*) as count FROM documentos WHERE proyecto_id = ? GROUP BY estado ORDER BY count DESC",
            (id,),
        ).fetchall()

        # Por modulo
        por_modulo = conn.execute(
            "SELECT modulo, COUNT(*) as count FROM documentos WHERE proyecto_id = ? GROUP BY modulo ORDER BY count DESC",
            (id,),
        ).fetchall()

        # Por etapa
        por_etapa = conn.execute(
            "SELECT etapa, COUNT(*) as count FROM documentos WHERE proyecto_id = ? GROUP BY etapa ORDER BY count DESC",
            (id,),
        ).fetchall()

        # Observaciones pendientes
        observaciones = conn.execute(
            "SELECT id, nombre, modulo, etapa, observacion FROM documentos WHERE proyecto_id = ? AND estado = 'OBS' ORDER BY fecha_creacion DESC",
            (id,),
        ).fetchall()

        # Eventos recientes del proyecto (ultimos 20)
        eventos = conn.execute(
            "SELECT * FROM eventos WHERE proyecto_id = ? ORDER BY fecha_creacion DESC LIMIT 20",
            (id,),
        ).fetchall()

    return {
        "proyecto": proyecto,
        "documentos": [dict(d) for d in documentos],
        "estadisticas": {
            "total_documentos": len(documentos),
            "por_estado": [dict(s) for s in stats_docs],
            "por_modulo": [dict(m) for m in por_modulo],
            "por_etapa": [dict(e) for e in por_etapa],
            "observaciones_pendientes": [dict(o) for o in observaciones],
        },
        "eventos_recientes": [dict(e) for e in eventos],
    }
```

---

## 2. backend/routers/eventos.py -- AGREGAR endpoint

Agregar al final del archivo (despues de los endpoints existentes):

```python
@router.get("/por-proyecto/{proyecto_id}")
def listar_eventos_por_proyecto(
    proyecto_id: int,
    user: dict = Depends(require_admin),
):
    """Lista eventos de un proyecto especifico. Requiere rol admin."""
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM eventos WHERE proyecto_id = ? ORDER BY fecha_creacion DESC LIMIT 50",
            (proyecto_id,),
        ).fetchall()
    return [dict(r) for r in rows]
```

---

## 3. frontend/src/types.ts -- AGREGAR interfaces

Agregar al final del archivo (despues de `ReporteGeneral`):

```typescript
export interface ProyectoDetalle {
  proyecto: Proyecto
  documentos: Documento[]
  estadisticas: {
    total_documentos: number
    por_estado: { estado: string; count: number }[]
    por_modulo: { modulo: string; count: number }[]
    por_etapa: { etapa: string; count: number }[]
    observaciones_pendientes: { id: number; nombre: string; modulo: string; etapa: string; observacion: string }[]
  }
  eventos_recientes: Evento[]
}
```

---

## 4. frontend/src/api.ts -- AGREGAR funciones

Agregar al import de types la interfaz `ProyectoDetalle`:

```typescript
import type { Proyecto, ProyectoIn, Documento, DocumentoIn, Usuario, LoginIn, RegisterIn, Token, PasswordChangeIn, PerfilUpdate, Evento, ReporteProyectos, ReporteDocumentos, ReporteGeneral, ProyectoDetalle } from './types'
```

Agregar despues de `exportarCSV`:

```typescript
// --- Proyecto Detalle ---
export const obtenerProyectoDetalle = (id: number) =>
  api.get<ProyectoDetalle>(`/proyectos/${id}/detail`).then(r => r.data)

export const listarEventosPorProyecto = (proyecto_id: number) =>
  api.get<Evento[]>(`/eventos/por-proyecto/${proyecto_id}`).then(r => r.data)
```

---

## 5. frontend/src/hooks/useProyectoDetail.ts (CREAR)

```typescript
import { useState, useCallback } from 'react'
import { obtenerProyectoDetalle, listarEventosPorProyecto } from '../api'
import type { ProyectoDetalle, Evento } from '../types'

export function useProyectoDetail() {
  const [detalle, setDetalle] = useState<ProyectoDetalle | null>(null)
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargarDetalle = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await obtenerProyectoDetalle(id)
      setDetalle(data)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al cargar detalle del proyecto')
    } finally {
      setLoading(false)
    }
  }, [])

  const cargarEventos = useCallback(async (proyecto_id: number) => {
    try {
      const data = await listarEventosPorProyecto(proyecto_id)
      setEventos(data)
    } catch (e: any) {
      // Silencioso: los eventos son opcionales (requieren admin)
      setEventos([])
    }
  }, [])

  return { detalle, eventos, loading, error, cargarDetalle, cargarEventos }
}
```

---

## 6. frontend/src/components/ProyectoDetail.tsx (CREAR)

```tsx
import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useProyectoDetail } from '../hooks/useProyectoDetail'
import ExportButton from './ExportButton'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const COLORS_ESTADO = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444']
const ESTADO_LABELS: Record<string, string> = { ING: 'Ingreso', OBS: 'Observado', COR: 'Corregido', APB: 'Aprobado' }
const ESTADO_BG: Record<string, string> = { ING: '#fef3c7', OBS: '#fee2e2', COR: '#dbeafe', APB: '#dcfce7' }
const ESTADO_COLOR: Record<string, string> = { ING: '#92400e', OBS: '#991b1b', COR: '#1e40af', APB: '#166534' }

const ETAPAS = ['CHK', 'R1', 'R2', 'R3', 'APB'] as const

export default function ProyectoDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { detalle, loading, error, cargarDetalle } = useProyectoDetail()

  useEffect(() => {
    if (id) cargarDetalle(Number(id))
  }, [id, cargarDetalle])

  if (loading) return <p>Cargando detalle...</p>
  if (error) return <p style={{ color: '#dc2626' }}>{error}</p>
  if (!detalle) return null

  const { proyecto, documentos, estadisticas, eventos_recientes } = detalle
  const nextEtapa = (etapa: string) => {
    const idx = ETAPAS.indexOf(etapa as any)
    return idx < ETAPAS.length - 1 ? ETAPAS[idx + 1] : null
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>
              <Link to="/proyectos" style={{ color: '#2563eb', textDecoration: 'none' }}>Proyectos</Link>
              {' / '}
              <span>Detalle</span>
            </div>
            <h1 style={{ margin: 0 }}>{proyecto.nombre}</h1>
          </div>
          <ExportButton entidad="documentos" label="Exportar documentos CSV" />
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
          <Badge label="Acronimo" value={proyecto.acronimo} />
          <Badge label="Etapa" value={proyecto.etapa_actual} color={proyecto.etapa_actual === 'APB' ? '#166534' : '#374151'} bg={proyecto.etapa_actual === 'APB' ? '#dcfce7' : '#f3f4f6'} />
          <Badge label="Cliente" value={proyecto.cliente || '—'} />
          {proyecto.ubicacion && <Badge label="Ubicacion" value={proyecto.ubicacion} />}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KPI label="Documentos" value={estadisticas.total_documentos} color="#7c3aed" />
        <KPI label="Observaciones" value={estadisticas.observaciones_pendientes.length} color="#dc2626" />
        <KPI label="Modulos" value={estadisticas.por_modulo.length} color="#059669" />
        <KPI label="Etapa actual" value={proyecto.etapa_actual} color="#2563eb" />
      </div>

      {/* Graficos */}
      {estadisticas.total_documentos > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 24 }}>
          <ChartCard title="Documentos por Estado">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={estadisticas.por_estado.map(d => ({ name: ESTADO_LABELS[d.estado] || d.estado, value: d.count }))}
                  cx="50%" cy="50%" outerRadius={70} dataKey="value" label
                >
                  {estadisticas.por_estado.map((_, i) => (
                    <Cell key={i} fill={COLORS_ESTADO[i % COLORS_ESTADO.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Documentos por Modulo">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={estadisticas.por_modulo}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="modulo" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Alertas de observaciones */}
      {estadisticas.observaciones_pendientes.length > 0 && (
        <div style={{ marginBottom: 24, padding: 16, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca' }}>
          <h3 style={{ margin: '0 0 12px', color: '#991b1b', fontSize: 14 }}>
            Observaciones pendientes ({estadisticas.observaciones_pendientes.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {estadisticas.observaciones_pendientes.map(o => (
              <div key={o.id} style={{ padding: '8px 12px', background: '#fff', borderRadius: 6, fontSize: 13 }}>
                <strong>{o.nombre}</strong> ({o.modulo}/{o.etapa})
                {o.observacion && <span style={{ color: '#6b7280', marginLeft: 8 }}>- {o.observacion}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de documentos */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Documentos ({documentos.length})</h2>
        {documentos.length === 0 ? (
          <p style={{ color: '#999' }}>Sin documentos asociados.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: 8 }}>ID</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Nombre</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Modulo</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Etapa</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Estado</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Tipo</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Observacion</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>{d.id}</td>
                  <td style={{ padding: 8 }}>{d.nombre}</td>
                  <td style={{ padding: 8 }}><code>{d.modulo}</code></td>
                  <td style={{ padding: 8 }}>{d.etapa}</td>
                  <td style={{ padding: 8 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: ESTADO_BG[d.estado] || '#f3f4f6',
                      color: ESTADO_COLOR[d.estado] || '#374151',
                    }}>
                      {ESTADO_LABELS[d.estado] || d.estado}
                    </span>
                  </td>
                  <td style={{ padding: 8 }}>{d.tipo}</td>
                  <td style={{ padding: 8, color: '#6b7280', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.observacion || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Timeline de eventos */}
      {eventos_recientes.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Actividad reciente</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {eventos_recientes.map(e => (
              <div key={e.id} style={{ padding: '8px 12px', borderRadius: 6, background: '#f9fafb', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  <strong style={{ color: '#374151' }}>{e.event}</strong>
                  {e.detalle && <span style={{ color: '#6b7280', marginLeft: 8 }}>{e.detalle}</span>}
                </span>
                <span style={{ color: '#9ca3af', fontSize: 12 }}>
                  {e.fecha_creacion ? new Date(e.fecha_creacion).toLocaleString() : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function KPI({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={{ padding: 16, borderRadius: 8, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

function Badge({ label, value, color, bg }: { label: string; value: string; color?: string; bg?: string }) {
  return (
    <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: bg || '#f3f4f6', color: color || '#374151' }}>
      <span style={{ color: '#6b7280' }}>{label}:</span> <strong>{value}</strong>
    </span>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#374151' }}>{title}</h3>
      {children}
    </div>
  )
}
```

---

## 7. frontend/src/components/ProyectoList.tsx -- MODIFICAR

Reemplazar la fila de la tabla `<tr key={p.id} ...>` para que el nombre sea un link al detalle:

En el `<tbody>`, reemplazar la celda del nombre:

```tsx
<td style={{ padding: 8 }}>
  <Link to={`/proyectos/${p.id}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
    {p.nombre}
  </Link>
</td>
```

Y agregar import de Link:

```tsx
import { Link } from 'react-router-dom'
```

---

## 8. frontend/src/App.tsx -- MODIFICAR

Agregar import y ruta nueva. Reemplazar el import de componentes:

```tsx
import ProyectoDetail from './components/ProyectoDetail'
```

Agregar dentro del Route con Layout, despues de `/proyectos`:

```tsx
<Route path="/proyectos/:id" element={<ProyectoDetail />} />
```

---

## 9. frontend/src/components/DocumentoList.tsx -- MODIFICAR (filtro visual por proyecto)

Agregar soporte para filtrar por `proyecto_id` via query param. Esto permite que al navegar desde la vista de detalle de un proyecto, se pueda ver la lista de documentos filtrada.

Agregar import:

```tsx
import { useSearchParams } from 'react-router-dom'
```

Modificar el componente para leer `proyecto_id` de los query params y pasarlo al hook:

```tsx
export default function DocumentoList() {
  const [searchParams] = useSearchParams()
  const proyecto_id = searchParams.get('proyecto_id')
  const { documentos, loading, error, fetch, ... } = useDocumentos(proyecto_id ? { proyecto_id } : undefined)
  // ... resto del componente
}
```

Nota: El hook `useDocumentos` ya acepta filtros opcionales. Verificar que `useDocumentos` acepte el parametro.

---

## 10. backend/tests/test_api_proyecto_detalle.py (CREAR)

```python
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


class TestProyectoDetalle:
    @pytest.fixture(autouse=True)
    def setup(self):
        from backend.database import get_conn
        with get_conn() as conn:
            conn.execute("DELETE FROM eventos")
            conn.execute("DELETE FROM documentos")
            conn.execute("DELETE FROM proyectos")
            conn.execute("DELETE FROM usuarios WHERE username != 'admin'")
            # Insertar proyecto de prueba
            conn.execute(
                "INSERT INTO proyectos (nombre, acronimo, etapa_actual, descripcion, cliente) VALUES (?, ?, ?, ?, ?)",
                ("Proyecto Test", "T-01", "CHK", "Desc", "Cliente X"),
            )
            row = conn.execute("SELECT id FROM proyectos WHERE acronimo = 'T-01'").fetchone()
            self.proyecto_id = row["id"]
            # Insertar documentos
            conn.executemany(
                "INSERT INTO documentos (proyecto_id, nombre, modulo, etapa, estado, tipo, tt, nn) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    (self.proyecto_id, "Doc 1", "EST", "CHK", "ING", "PDF", "01", "01"),
                    (self.proyecto_id, "Doc 2", "EST", "CHK", "APB", "PDF", "01", "02"),
                    (self.proyecto_id, "Doc 3", "HAB", "CHK", "OBS", "PDF", "02", "01"),
                ],
            )

    def _login(self, username, password):
        r = client.post("/api/auth/login", json={"username": username, "password": password})
        assert r.status_code == 200
        return r.json()["access_token"]

    def test_detalle_requiere_auth(self):
        r = client.get(f"/api/proyectos/{self.proyecto_id}/detail")
        assert r.status_code == 401

    def test_detalle_proyecto_existente(self):
        token = self._login("admin", "admin123")
        r = client.get(f"/api/proyectos/{self.proyecto_id}/detail", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        data = r.json()
        assert "proyecto" in data
        assert data["proyecto"]["nombre"] == "Proyecto Test"
        assert "documentos" in data
        assert len(data["documentos"]) == 3
        assert "estadisticas" in data
        assert data["estadisticas"]["total_documentos"] == 3
        assert "eventos_recientes" in data

    def test_detalle_proyecto_inexistente(self):
        token = self._login("admin", "admin123")
        r = client.get("/api/proyectos/99999/detail", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 404

    def test_detalle_observaciones_pendientes(self):
        token = self._login("admin", "admin123")
        r = client.get(f"/api/proyectos/{self.proyecto_id}/detail", headers={"Authorization": f"Bearer {token}"})
        data = r.json()
        obs = data["estadisticas"]["observaciones_pendientes"]
        assert len(obs) == 1
        assert obs[0]["nombre"] == "Doc 3"

    def test_detalle_estadisticas_por_estado(self):
        token = self._login("admin", "admin123")
        r = client.get(f"/api/proyectos/{self.proyecto_id}/detail", headers={"Authorization": f"Bearer {token}"})
        data = r.json()
        por_estado = data["estadisticas"]["por_estado"]
        estados = {e["estado"]: e["count"] for e in por_estado}
        assert estados.get("ING") == 1
        assert estados.get("APB") == 1
        assert estados.get("OBS") == 1

    def test_eventos_por_proyecto_requiere_admin(self):
        # Crear usuario no-admin
        client.post("/api/auth/register", json={"username": "user2", "email": "u2@test.com", "password": "user2123"})
        token = self._login("user2", "user2123")
        r = client.get(f"/api/eventos/por-proyecto/{self.proyecto_id}", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 403

    def test_eventos_por_proyecto_admin(self):
        token = self._login("admin", "admin123")
        r = client.get(f"/api/eventos/por-proyecto/{self.proyecto_id}", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)
```

---

## Archivos existentes (NO MODIFICAR salvo lo indicado arriba)

```
spec_engine/
specs/
backend/domain/
backend/middleware/
backend/database.py
backend/registro.py
backend/routers/auth.py
backend/routers/reportes.py
backend/schemas/
backend/tests/test_api_auth.py
backend/tests/test_api_admin.py
backend/tests/test_api_eventos.py
backend/tests/test_api_reportes.py
backend/tests/test_database.py
backend/tests/test_*transitions.py
backend/tests/test_api_proyectos.py
backend/tests/test_api_documentos.py
frontend/src/components/LoginPage.tsx
frontend/src/components/AdminPage.tsx
frontend/src/components/PerfilPage.tsx
frontend/src/components/AuditoriaPage.tsx
frontend/src/components/Dashboard.tsx
frontend/src/components/ExportButton.tsx
frontend/src/hooks/useStats.ts
frontend/src/hooks/useAuth.ts
frontend/src/hooks/useAdmin.ts
frontend/src/hooks/useAuditoria.ts
frontend/src/hooks/useReportes.ts
frontend/src/hooks/useDocumentos.ts
frontend/src/context/AuthContext.tsx
frontend/src/main.tsx
frontend/src/vite.config.ts
frontend/src/tsconfig*.json
frontend/index.html
frontend/package.json  # recharts ya existe de sesion 7
Dockerfile.backend
Dockerfile.frontend
docker-compose.yml
```

---

## Invariantes a respetar

| Inv | Texto | Como se verifica |
|-----|-------|------------------|
| I-5  | Frontend puede consumir API | Endpoint `/detail` devuelve JSON completo, eventos por proyecto protegido con admin |
| I-6  | Separacion backend/frontend | Calculo de agregaciones solo en backend, frontend solo visualiza |
| I-8  | Todos los endpoints protegidos | `/detail` requiere `require_auth`, eventos por proyecto requieren `require_admin` |
| I-9  | Navegacion funcional | Breadcrumb funciona, links de listado a detalle funcionan, boton volver |

---

## Notas de implementacion

1. **El endpoint `/detail`** reutiliza la misma conexion SQLite para todas las queries, minimizando overhead. Todas las queries son lecturas (SELECT).

2. **Eventos por proyecto** es un endpoint separado bajo `/api/eventos/` que requiere rol admin para mantener consistencia con el resto del router de eventos. El endpoint `/detail` incluye los ultimos 20 eventos del proyecto directamente para no requerir llamadas adicionales.

3. **Los graficos en ProyectoDetail** usan `ResponsiveContainer` igual que el Dashboard. Los colores de estado son los mismos para consistencia visual.

4. **La lista de observaciones pendientes** se muestra como alerta visual solo cuando hay documentos en estado OBS, para que el usuario identifique rapidamente problemas.

5. **El breadcrumb** usa `<Link>` de react-router-dom para navegar de vuelta a la lista sin recargar la pagina.

6. **La tabla de documentos** en la vista de detalle incluye todas las columnas relevantes. No incluye acciones de CRUD (eso permanece en DocumentoList), solo visualizacion.

7. **La pagina DocumentoList** ya soporta `proyecto_id` como filtro via query params. Se mejora para que si se navega a `/documentos?proyecto_id=X`, se muestre el nombre del proyecto como contexto visual.
