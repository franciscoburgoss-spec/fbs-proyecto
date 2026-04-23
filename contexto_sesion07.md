# Contexto Sesion 7 -- Dashboard Avanzado con Graficos, KPIs y Exportacion

> **Hardware:** MacBook Air 7,2 * 8GB RAM * 128GB SSD * Python 3.11+ nativo
> **Objetivo:** Agregar endpoints de estadisticas agregadas en el backend, reemplazar el calculo en frontend por datos reales de la BD, integrar graficos interactivos y exportacion a CSV.
> **Tiempo estimado:** 2-3 horas.

---

## Paso previo obligatorio

Clonar el repositorio actualizado con las sesiones 1-6:

```bash
git clone https://github.com/franciscoburgoss-spec/fbs-proyecto.git
cd fbs-proyecto
```

**NO modificar** los archivos existentes del backend (`main.py`, `database.py`, `routers/`, `schemas/`, `domain/`, `middleware/`, `tests/`) salvo las actualizaciones explicitas indicadas en esta sesion.

---

## Estado previo (sesiones 1-6 en main)

- `spec_engine/` -- Motor de especificaciones completo
- `specs/` -- `documento.yaml`, `proyecto.yaml` con maquinas de estado
- `backend/` -- FastAPI v1.3.0 con CORS, routers CRUD + transiciones + auth JWT + roles + perfil + auditoria, middleware de errores, 102 tests
  - `auth.py` -- Login, registro, `/me`, `require_auth`, `require_admin`, gestion usuarios, perfil
  - `eventos.py` -- Router de auditoria con filtros, paginacion y estadisticas
  - `registro.py` -- `emit_evento()` guarda eventos en archivo JSONL y SQLite
- `frontend/` -- React + TypeScript, Vite, Dashboard (con calculo en frontend), CRUD, hooks, Layout, LoginPage, AuthContext, AdminPage, PerfilPage, AuditoriaPage
- `docker-compose.yml` -- Backend + Frontend + JWT_SECRET

---

## Archivos a crear en esta sesion

```
backend/
  routers/
    reportes.py            # Endpoints de estadisticas agregadas desde la BD
  tests/
    test_api_reportes.py   # Tests de reportes y exportacion
frontend/src/
  components/
    ExportButton.tsx       # Boton reutilizable para exportar CSV
  hooks/
    useReportes.ts         # Hook para consultar estadisticas del backend
```

## Archivos a modificar

```
backend/main.py                 # Bump version a 1.4.0, registrar router reportes
backend/routers/__init__.py     # Exportar router reportes
frontend/package.json           # Agregar dependencia recharts
frontend/src/types.ts           # Agregar interfaces Reportes, FiltrosReporte
frontend/src/api.ts             # Agregar endpoints de reportes y exportacion CSV
frontend/src/App.tsx            # Sin cambios (reutiliza rutas existentes)
frontend/src/components/Dashboard.tsx  # Reemplazar calculo local por datos del backend + graficos
frontend/src/components/Layout.tsx     # Sin cambios
```

---

## 1. backend/routers/reportes.py (CREAR)

```python
from fastapi import APIRouter, Depends, Query
from typing import Optional, Literal

from backend.database import get_conn
from backend.routers.auth import require_auth

router = APIRouter()


@router.get("/proyectos")
def reporte_proyectos(user: dict = Depends(require_auth)):
    """Estadisticas agregadas de proyectos: total y por etapa."""
    with get_conn() as conn:
        total = conn.execute("SELECT COUNT(*) FROM proyectos").fetchone()[0]
        por_etapa = conn.execute(
            "SELECT etapa_actual, COUNT(*) as count FROM proyectos GROUP BY etapa_actual ORDER BY count DESC"
        ).fetchall()
        por_cliente = conn.execute(
            "SELECT cliente, COUNT(*) as count FROM proyectos WHERE cliente IS NOT NULL GROUP BY cliente ORDER BY count DESC LIMIT 10"
        ).fetchall()
        recientes = conn.execute(
            "SELECT id, nombre, acronimo, etapa_actual, fecha_creacion FROM proyectos ORDER BY fecha_creacion DESC LIMIT 5"
        ).fetchall()

    return {
        "total": total,
        "por_etapa": [dict(r) for r in por_etapa],
        "por_cliente": [dict(r) for r in por_cliente],
        "recientes": [dict(r) for r in recientes],
    }


@router.get("/documentos")
def reporte_documentos(
    user: dict = Depends(require_auth),
    proyecto_id: Optional[int] = Query(None),
):
    """Estadisticas agregadas de documentos: total, por estado, por modulo, por etapa."""
    where = ""
    params = []
    if proyecto_id:
        where = " WHERE proyecto_id = ?"
        params = [proyecto_id]

    with get_conn() as conn:
        total = conn.execute(
            f"SELECT COUNT(*) FROM documentos{where}", params
        ).fetchone()[0]

        por_estado = conn.execute(
            f"SELECT estado, COUNT(*) as count FROM documentos{where} GROUP BY estado ORDER BY count DESC",
            params,
        ).fetchall()

        por_modulo = conn.execute(
            f"SELECT modulo, COUNT(*) as count FROM documentos{where} GROUP BY modulo ORDER BY count DESC",
            params,
        ).fetchall()

        por_etapa = conn.execute(
            f"SELECT etapa, COUNT(*) as count FROM documentos{where} GROUP BY etapa ORDER BY count DESC",
            params,
        ).fetchall()

        # Documentos con observaciones pendientes (estado OBS)
        observaciones = conn.execute(
            f"SELECT d.id, d.nombre, d.modulo, d.etapa, d.observacion, p.acronimo FROM documentos d JOIN proyectos p ON d.proyecto_id = p.id WHERE d.estado = 'OBS'{(' AND d.proyecto_id = ?' if proyecto_id else '')} ORDER BY d.fecha_creacion DESC LIMIT 10",
            ([proyecto_id] if proyecto_id else []),
        ).fetchall()

    return {
        "total": total,
        "por_estado": [dict(r) for r in por_estado],
        "por_modulo": [dict(r) for r in por_modulo],
        "por_etapa": [dict(r) for r in por_etapa],
        "observaciones_pendientes": [dict(r) for r in observaciones],
    }


@router.get("/general")
def reporte_general(user: dict = Depends(require_auth)):
    """Dashboard general: KPIs combinados de proyectos, documentos y usuarios."""
    with get_conn() as conn:
        total_proyectos = conn.execute("SELECT COUNT(*) FROM proyectos").fetchone()[0]
        total_documentos = conn.execute("SELECT COUNT(*) FROM documentos").fetchone()[0]
        total_usuarios = conn.execute("SELECT COUNT(*) FROM usuarios").fetchone()[0]
        total_eventos = conn.execute("SELECT COUNT(*) FROM eventos").fetchone()[0]

        # Documentos por estado para el grafico principal
        doc_por_estado = conn.execute(
            "SELECT estado, COUNT(*) as count FROM documentos GROUP BY estado ORDER BY count DESC"
        ).fetchall()

        # Proyectos por etapa
        proj_por_etapa = conn.execute(
            "SELECT etapa_actual, COUNT(*) as count FROM proyectos GROUP BY etapa_actual ORDER BY count DESC"
        ).fetchall()

        # Evolucion de proyectos por mes (ultimos 6 meses)
        evolucion = conn.execute(
            "SELECT strftime('%Y-%m', fecha_creacion) as mes, COUNT(*) as count FROM proyectos GROUP BY mes ORDER BY mes DESC LIMIT 6"
        ).fetchall()

    return {
        "totales": {
            "proyectos": total_proyectos,
            "documentos": total_documentos,
            "usuarios": total_usuarios,
            "eventos": total_eventos,
        },
        "documentos_por_estado": [dict(r) for r in doc_por_estado],
        "proyectos_por_etapa": [dict(r) for r in proj_por_etapa],
        "evolucion_proyectos": [dict(r) for r in evolucion],
    }


@router.get("/export/csv")
def exportar_csv(
    user: dict = Depends(require_auth),
    entidad: Literal["proyectos", "documentos"] = Query(...),
):
    """Exporta proyectos o documentos a CSV. Devuelve texto plano CSV."""
    import csv
    import io

    output = io.StringIO()
    writer = csv.writer(output)

    with get_conn() as conn:
        if entidad == "proyectos":
            writer.writerow(["ID", "Nombre", "Acronimo", "Etapa", "Descripcion", "Cliente", "Ubicacion", "Fecha Creacion"])
            rows = conn.execute("SELECT * FROM proyectos ORDER BY id").fetchall()
            for r in rows:
                writer.writerow([r["id"], r["nombre"], r["acronimo"], r["etapa_actual"], r["descripcion"], r["cliente"], r["ubicacion"], r["fecha_creacion"]])
        else:
            writer.writerow(["ID", "Proyecto ID", "Nombre", "Modulo", "Etapa", "Estado", "Tipo", "TT", "NN", "Observacion", "Fecha Creacion"])
            rows = conn.execute("SELECT * FROM documentos ORDER BY id").fetchall()
            for r in rows:
                writer.writerow([r["id"], r["proyecto_id"], r["nombre"], r["modulo"], r["etapa"], r["estado"], r["tipo"], r["tt"], r["nn"], r["observacion"], r["fecha_creacion"]])

    from fastapi import Response
    filename = f"{entidad}_export.csv"
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
```

---

## 2. backend/main.py

### 2a. Importar router

Reemplazar la linea de imports:

```python
from backend.routers import proyectos, documentos, auth, eventos, reportes
```

### 2b. Bump version

```python
app = FastAPI(
    title="FBS API",
    version="1.4.0",
    description="Backend de gestion de proyectos y documentos con spec_engine, auth JWT, roles, auditoria y reportes",
)
```

### 2c. Registrar router

Agregar despues de los routers existentes:

```python
app.include_router(reportes.router, prefix="/api/reportes", tags=["reportes"])
```

---

## 3. backend/routers/__init__.py

```python
from backend.routers import proyectos, documentos, auth, eventos, reportes
```

---

## 4. frontend/src/types.ts

Agregar interfaces al final del archivo:

```typescript
export interface ReporteProyectos {
  total: number
  por_etapa: { etapa_actual: string; count: number }[]
  por_cliente: { cliente: string; count: number }[]
  recientes: { id: number; nombre: string; acronimo: string; etapa_actual: string; fecha_creacion: string }[]
}

export interface ReporteDocumentos {
  total: number
  por_estado: { estado: string; count: number }[]
  por_modulo: { modulo: string; count: number }[]
  por_etapa: { etapa: string; count: number }[]
  observaciones_pendientes: { id: number; nombre: string; modulo: string; etapa: string; observacion: string; acronimo: string }[]
}

export interface ReporteGeneral {
  totales: { proyectos: number; documentos: number; usuarios: number; eventos: number }
  documentos_por_estado: { estado: string; count: number }[]
  proyectos_por_etapa: { etapa_actual: string; count: number }[]
  evolucion_proyectos: { mes: string; count: number }[]
}
```

---

## 5. frontend/package.json

Agregar la dependencia `recharts` en `dependencies`:

```json
  "dependencies": {
    "axios": "^1.6.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "recharts": "^2.10.0"
  }
```

Despues de modificar, ejecutar `npm install` en el directorio `frontend/`.

---

## 6. frontend/src/api.ts

Agregar `ReporteProyectos`, `ReporteDocumentos`, `ReporteGeneral` al import de types:

```typescript
import type { Proyecto, ProyectoIn, Documento, DocumentoIn, Usuario, LoginIn, RegisterIn, Token, PasswordChangeIn, PerfilUpdate, Evento, ReporteProyectos, ReporteDocumentos, ReporteGeneral } from './types'
```

Agregar funciones despues de `obtenerStatsEventos`:

```typescript
// --- Reportes ---
export const obtenerReporteGeneral = () =>
  api.get<ReporteGeneral>('/reportes/general').then(r => r.data)

export const obtenerReporteProyectos = () =>
  api.get<ReporteProyectos>('/reportes/proyectos').then(r => r.data)

export const obtenerReporteDocumentos = (proyecto_id?: number) =>
  api.get<ReporteDocumentos>('/reportes/documentos', { params: proyecto_id ? { proyecto_id } : undefined }).then(r => r.data)

export const exportarCSV = (entidad: 'proyectos' | 'documentos') =>
  api.get(`/reportes/export/csv?entidad=${entidad}`, { responseType: 'blob' }).then(r => {
    const url = window.URL.createObjectURL(new Blob([r.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${entidad}_export.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  })
```

---

## 7. frontend/src/hooks/useReportes.ts (CREAR)

```typescript
import { useState, useCallback } from 'react'
import { obtenerReporteGeneral, obtenerReporteProyectos, obtenerReporteDocumentos } from '../api'
import type { ReporteGeneral, ReporteProyectos, ReporteDocumentos } from '../types'

export function useReportes() {
  const [general, setGeneral] = useState<ReporteGeneral | null>(null)
  const [proyectos, setProyectos] = useState<ReporteProyectos | null>(null)
  const [documentos, setDocumentos] = useState<ReporteDocumentos | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargarGeneral = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await obtenerReporteGeneral()
      setGeneral(data)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al cargar reporte')
    } finally {
      setLoading(false)
    }
  }, [])

  const cargarProyectos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await obtenerReporteProyectos()
      setProyectos(data)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al cargar reporte de proyectos')
    } finally {
      setLoading(false)
    }
  }, [])

  const cargarDocumentos = useCallback(async (proyecto_id?: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await obtenerReporteDocumentos(proyecto_id)
      setDocumentos(data)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al cargar reporte de documentos')
    } finally {
      setLoading(false)
    }
  }, [])

  return { general, proyectos, documentos, loading, error, cargarGeneral, cargarProyectos, cargarDocumentos }
}
```

---

## 8. frontend/src/components/ExportButton.tsx (CREAR)

```tsx
import { useState } from 'react'
import { exportarCSV } from '../api'

interface ExportButtonProps {
  entidad: 'proyectos' | 'documentos'
  label?: string
}

export default function ExportButton({ entidad, label }: ExportButtonProps) {
  const [exportando, setExportando] = useState(false)

  const handleExport = async () => {
    setExportando(true)
    try {
      await exportarCSV(entidad)
    } catch (e) {
      alert('Error al exportar')
    } finally {
      setExportando(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exportando}
      style={{
        padding: '8px 16px',
        borderRadius: 6,
        border: '1px solid #d1d5db',
        background: '#fff',
        cursor: exportando ? 'not-allowed' : 'pointer',
        fontSize: 13,
        opacity: exportando ? 0.6 : 1,
      }}
    >
      {exportando ? 'Exportando...' : (label || `Exportar ${entidad} CSV`)}
    </button>
  )
}
```

---

## 9. frontend/src/components/Dashboard.tsx (REEMPLAZAR)

```tsx
import { useEffect } from 'react'
import { useReportes } from '../hooks/useReportes'
import { useStats } from '../hooks/useStats'
import { Link } from 'react-router-dom'
import ExportButton from './ExportButton'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line,
} from 'recharts'

const COLORS_ESTADO = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444']
const COLORS_ETAPA = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6']

const ETAPA_LABELS: Record<string, string> = {
  CHK: 'Chk',
  R1: 'R1',
  R2: 'R2',
  R3: 'R3',
}

const ESTADO_LABELS: Record<string, string> = {
  ING: 'Ingreso',
  OBS: 'Observado',
  COR: 'Corregido',
  APB: 'Aprobado',
}

export default function Dashboard() {
  const { stats } = useStats()
  const { general, loading, error, cargarGeneral } = useReportes()

  useEffect(() => {
    cargarGeneral()
  }, [cargarGeneral])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <ExportButton entidad="proyectos" />
          <ExportButton entidad="documentos" />
        </div>
      </div>

      {error && <p style={{ color: '#dc2626' }}>{error}</p>}
      {loading && !general && <p>Cargando reportes...</p>}

      {/* KPIs superiores */}
      {general && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          <KPICard title="Proyectos" value={general.totales.proyectos} color="#2563eb" link="/proyectos" />
          <KPICard title="Documentos" value={general.totales.documentos} color="#7c3aed" link="/documentos" />
          <KPICard title="Usuarios" value={general.totales.usuarios} color="#059669" link="/admin" />
          <KPICard title="Eventos" value={general.totales.eventos} color="#dc2626" link="/auditoria" />
        </div>
      )}

      {/* Graficos */}
      {general && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 32 }}>
          {/* Pie Chart - Documentos por Estado */}
          <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#374151' }}>Documentos por Estado</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={general.documentos_por_estado.map(d => ({ name: ESTADO_LABELS[d.estado] || d.estado, value: d.count }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label
                >
                  {general.documentos_por_estado.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={COLORS_ESTADO[i % COLORS_ESTADO.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart - Proyectos por Etapa */}
          <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#374151' }}>Proyectos por Etapa</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={general.proyectos_por_etapa.map(d => ({ name: ETAPA_LABELS[d.etapa_actual] || d.etapa_actual, value: d.count }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Line Chart - Evolucion de Proyectos */}
          <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#374151' }}>Evolucion de Proyectos (ultimos 6 meses)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={[...general.evolucion_proyectos].reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Observaciones pendientes */}
          <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#374151' }}>Resumen Rapido</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats?.por_estado && Object.entries(stats.por_estado).map(([estado, count]) => (
                <div key={estado} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>{ESTADO_LABELS[estado] || estado}</span>
                  <span style={{
                    padding: '2px 10px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 600,
                    background: estado === 'APB' ? '#dcfce7' : estado === 'OBS' ? '#fee2e2' : estado === 'COR' ? '#dbeafe' : '#fef3c7',
                    color: estado === 'APB' ? '#166534' : estado === 'OBS' ? '#991b1b' : estado === 'COR' ? '#1e40af' : '#92400e',
                  }}>
                    {count as number}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sin datos */}
      {!general && !loading && !error && (
        <p style={{ textAlign: 'center', color: '#999' }}>No hay datos disponibles.</p>
      )}
    </div>
  )
}

function KPICard({ title, value, color, link }: { title: string; value: number; color: string; link: string }) {
  return (
    <Link to={link} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        padding: 20,
        borderRadius: 8,
        borderLeft: `4px solid ${color}`,
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'transform 0.2s',
      }}>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      </div>
    </Link>
  )
}
```

---

## 10. backend/tests/test_api_reportes.py (CREAR)

```python
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


class TestReportes:
    @pytest.fixture(autouse=True)
    def setup(self):
        """Limpiar datos antes de cada test."""
        from backend.database import get_conn
        with get_conn() as conn:
            conn.execute("DELETE FROM eventos")
            conn.execute("DELETE FROM documentos")
            conn.execute("DELETE FROM proyectos")
            conn.execute("DELETE FROM usuarios WHERE username != 'admin'")
            # Insertar datos de prueba
            conn.executemany(
                "INSERT INTO proyectos (nombre, acronimo, etapa_actual, descripcion, cliente) VALUES (?, ?, ?, ?, ?)",
                [
                    ("Proyecto A", "A-01", "CHK", "Desc A", "Cliente 1"),
                    ("Proyecto B", "B-02", "R1", "Desc B", "Cliente 1"),
                    ("Proyecto C", "C-03", "R2", "Desc C", "Cliente 2"),
                ],
            )
            conn.executemany(
                "INSERT INTO documentos (proyecto_id, nombre, modulo, etapa, estado, tipo, tt, nn) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    (1, "Doc 1", "EST", "CHK", "ING", "PDF", "01", "01"),
                    (1, "Doc 2", "EST", "CHK", "APB", "PDF", "01", "02"),
                    (1, "Doc 3", "HAB", "CHK", "OBS", "PDF", "02", "01"),
                    (2, "Doc 4", "MDS", "R1", "COR", "PDF", "03", "01"),
                ],
            )

    def _login(self, username, password):
        r = client.post("/api/auth/login", json={"username": username, "password": password})
        assert r.status_code == 200
        return r.json()["access_token"]

    # --- reporte general ---

    def test_reporte_general_requiere_auth(self):
        r = client.get("/api/reportes/general")
        assert r.status_code == 401

    def test_reporte_general_funciona(self):
        token = self._login("admin", "admin123")
        r = client.get("/api/reportes/general", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        data = r.json()
        assert "totales" in data
        assert data["totales"]["proyectos"] == 3
        assert data["totales"]["documentos"] == 4
        assert "documentos_por_estado" in data
        assert "proyectos_por_etapa" in data
        assert "evolucion_proyectos" in data

    # --- reporte proyectos ---

    def test_reporte_proyectos(self):
        token = self._login("admin", "admin123")
        r = client.get("/api/reportes/proyectos", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        data = r.json()
        assert data["total"] == 3
        assert len(data["por_etapa"]) >= 1
        assert len(data["por_cliente"]) >= 1
        assert len(data["recientes"]) <= 5

    # --- reporte documentos ---

    def test_reporte_documentos(self):
        token = self._login("admin", "admin123")
        r = client.get("/api/reportes/documentos", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        data = r.json()
        assert data["total"] == 4
        assert len(data["por_estado"]) >= 1
        assert len(data["por_modulo"]) >= 1
        assert len(data["por_etapa"]) >= 1

    def test_reporte_documentos_filtrado_por_proyecto(self):
        token = self._login("admin", "admin123")
        r = client.get("/api/reportes/documentos?proyecto_id=1", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        data = r.json()
        assert data["total"] == 3  # Solo documentos del proyecto 1

    # --- exportar CSV ---

    def test_exportar_proyectos_csv(self):
        token = self._login("admin", "admin123")
        r = client.get("/api/reportes/export/csv?entidad=proyectos", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert r.headers["content-type"] == "text/csv"
        content = r.content.decode()
        assert "ID,Nombre,Acronimo" in content
        assert "Proyecto A" in content

    def test_exportar_documentos_csv(self):
        token = self._login("admin", "admin123")
        r = client.get("/api/reportes/export/csv?entidad=documentos", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert r.headers["content-type"] == "text/csv"
        content = r.content.decode()
        assert "ID,Proyecto ID,Nombre" in content
        assert "Doc 1" in content

    def test_exportar_csv_sin_auth(self):
        r = client.get("/api/reportes/export/csv?entidad=proyectos")
        assert r.status_code == 401

    def test_exportar_csv_entidad_invalida(self):
        token = self._login("admin", "admin123")
        r = client.get("/api/reportes/export/csv?entidad=invalido", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 422
```

---

## Archivos existentes (NO MODIFICAR salvo lo indicado arriba)

```
spec_engine/
specs/
backend/domain/
backend/middleware/
backend/database.py             # sin cambios (tabla eventos ya existe de sesion 6)
backend/registro.py             # sin cambios
backend/routers/auth.py         # sin cambios
backend/routers/eventos.py      # sin cambios
backend/routers/proyectos.py    # sin cambios
backend/routers/documentos.py   # sin cambios
backend/schemas/auth.py         # sin cambios
backend/schemas/documento.py    # sin cambios
backend/schemas/evento.py       # sin cambios
backend/schemas/proyecto.py     # sin cambios
backend/tests/test_api_auth.py  # sin cambios
backend/tests/test_api_admin.py # sin cambios
backend/tests/test_api_eventos.py  # sin cambios
backend/tests/test_database.py  # sin cambios
backend/tests/test_*transitions.py  # sin cambios
backend/tests/test_api_proyectos.py # sin cambios
backend/tests/test_api_documentos.py # sin cambios
frontend/src/components/ProyectoList.tsx    # sin cambios
frontend/src/components/DocumentoList.tsx   # sin cambios
frontend/src/components/LoginPage.tsx       # sin cambios
frontend/src/components/AdminPage.tsx       # sin cambios
frontend/src/components/PerfilPage.tsx      # sin cambios
frontend/src/components/AuditoriaPage.tsx   # sin cambios
frontend/src/hooks/useProyectos.ts          # sin cambios
frontend/src/hooks/useDocumentos.ts         # sin cambios
frontend/src/hooks/useStats.ts              # sin cambios
frontend/src/hooks/useAuth.ts               # sin cambios
frontend/src/hooks/useAdmin.ts              # sin cambios
frontend/src/hooks/useAuditoria.ts          # sin cambios
frontend/src/context/AuthContext.tsx        # sin cambios
frontend/src/main.tsx                       # sin cambios
frontend/src/vite.config.ts                 # sin cambios
frontend/src/tsconfig*.json                 # sin cambios
frontend/index.html                         # sin cambios
Dockerfile.backend                          # sin cambios
Dockerfile.frontend                         # sin cambios
docker-compose.yml                          # sin cambios
```

---

## Invariantes a respetar

| Inv | Texto | Como se verifica |
|-----|-------|------------------|
| I-5  | Frontend puede consumir API | Endpoints de reportes devuelven JSON, CSV tiene content-type correcto |
| I-6  | Separacion backend/frontend | Calculo de agregaciones solo en backend, frontend solo visualiza |
| I-7  | Exportacion no bloquea la app | CSV se genera en memoria y se devuelve como stream |
| I-8  | Todos los endpoints protegidos | Reportes requieren `require_auth` (cualquier usuario autenticado) |

---

## Notas de implementacion

1. **Instalar `recharts`** en el frontend antes de compilar: `cd frontend && npm install`

2. **El hook `useStats`** se mantiene para compatibilidad con otros componentes que lo usan, pero el Dashboard principal ahora usa `useReportes` que obtiene datos reales del backend.

3. **Los graficos usan `ResponsiveContainer`** para adaptarse al ancho disponible. El grid de 2 columnas se apila en pantallas pequenas.

4. **La exportacion CSV** se genera en memoria con `io.StringIO` y se devuelve como `Response` con header `Content-Disposition: attachment` para forzar la descarga.

5. **Los KPIs son links** que navegan a las secciones correspondientes del sistema.

6. **Las observaciones pendientes** se incluyen en el reporte de documentos para que el dashboard pueda mostrar alertas visuales.
