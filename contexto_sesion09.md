# Contexto Sesion 9 — Hardening para Produccion Local en MacBook Air

> **Hardware:** MacBook Air 7,2 * 8GB RAM * 128GB SSD * Python 3.11+ nativo
> **Objetivo:** Convertir la aplicacion en un producto listo para correr todo el dia en la MacBook sin Docker, con seguridad minima viable, build estatico del frontend, y script nativo de inicio.
> **Tiempo estimado:** 2-3 horas.

---

## Paso previo obligatorio

Clonar el repositorio actualizado con las sesiones 1-8:

```bash
git clone https://github.com/franciscoburgoss-spec/fbs-proyecto.git
cd fbs-proyecto
```

**NO modificar** los archivos existentes del backend (`database.py`, `registro.py`, `routers/` salvo los indicados, `schemas/`, `domain/`, `middleware/` salvo los indicados, `tests/` salvo los indicados) ni del frontend (salvo los explicitos).

---

## Estado previo (sesiones 1-8 en main)

- `spec_engine/` — Motor de especificaciones completo
- `specs/` — `documento.yaml`, `proyecto.yaml` con maquinas de estado
- `backend/` — FastAPI v1.4.0 con CORS, routers CRUD + transiciones + auth JWT + roles + perfil + auditoria + reportes + detalle de proyecto, middleware de errores, ~120 tests
  - `auth.py` — Login, registro, `/me`, `require_auth`, `require_admin`, gestion usuarios, perfil. JWT_SECRET con fallback hardcodeado.
  - `proyectos.py` — CRUD + endpoint `/{id}/detail` con estadisticas, documentos, eventos
  - `eventos.py` — Auditoria + endpoint `/por-proyecto/{proyecto_id}` (admin)
  - `reportes.py` — Estadisticas agregadas y exportacion CSV
  - `registro.py` — `emit_evento()` guarda eventos en JSONL y SQLite con `proyecto_id`
- `frontend/` — React + TypeScript, Vite, Dashboard con Recharts, CRUD, hooks, Layout, LoginPage, AuthContext, AdminPage, PerfilPage, AuditoriaPage, ProyectoDetail, ExportButton
- `docker-compose.yml` — Backend + Frontend + JWT_SECRET (NO usarse en MacBook Air por consumo de RAM)
- `fbs.db` — SQLite con datos de demo y admin por defecto

---

## Archivos a crear en esta sesion

```
scripts/
  start.sh                         # Script nativo para macOS: build + backup + uvicorn
  backup.sh                        # Script de backup de la BD
.env.example                     # Variables de entorno requeridas
backend/middleware/
  security.py                      # Middleware de headers de seguridad HTTP
backend/tests/
  test_api_produccion.py           # Tests de rate limit, health check DB, JWT_SECRET obligatorio
```

## Archivos a modificar

```
backend/main.py                  # CORS configurable, StaticFiles, health check DB, registrar middlewares
backend/routers/auth.py          # JWT_SECRET obligatorio, rate limiting en login
README.md                        # Instrucciones de produccion local nativa (sin Docker)
```

---

## 1. backend/middleware/security.py (CREAR)

Middleware de headers de seguridad HTTP minimos.

```python
from fastapi import Request
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return response
```

---

## 2. backend/main.py — MODIFICAR

### 2.1 Reemplazar imports al inicio:

```python
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.database import get_conn, init_db, seed_data
from backend.routers import proyectos, documentos, auth, eventos, reportes
from backend.middleware.spec_errors import register_spec_error_handlers
from backend.middleware.security import SecurityHeadersMiddleware
```

### 2.2 Reemplazar configuracion CORS y agregar middlewares (despues de `app = FastAPI(...)`):

```python
# CORS: configurable via env, por defecto localhost
CORS_ORIGINS = os.environ.get(
    "FBS_CORS_ORIGINS",
    "http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:4173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in CORS_ORIGINS if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Headers de seguridad HTTP
app.add_middleware(SecurityHeadersMiddleware)
```

### 2.3 Reemplazar health check:

```python
@app.get("/api/health", tags=["health"])
def health():
    try:
        with get_conn() as conn:
            conn.execute("SELECT 1").fetchone()
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        return {"status": "error", "db": str(e)}
```

### 2.4 Agregar al final del archivo (despues del health check):

Servir el frontend estatico solo si existe el directorio `frontend/dist`. Esto elimina la necesidad de Node.js en ejecucion.

```python
# Servir frontend estatico (build de produccion) si existe
DIST_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(DIST_DIR):
    app.mount("/", StaticFiles(directory=DIST_DIR, html=True), name="static")
```

El archivo completo de `backend/main.py` queda asi (para referencia del implementador):

```python
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.database import get_conn, init_db, seed_data
from backend.routers import proyectos, documentos, auth, eventos, reportes
from backend.middleware.spec_errors import register_spec_error_handlers
from backend.middleware.security import SecurityHeadersMiddleware

app = FastAPI(
    title="FBS API",
    version="1.5.0",
    description="Backend de gestion de proyectos y documentos con spec_engine, auth JWT, roles, auditoria y reportes",
)

CORS_ORIGINS = os.environ.get(
    "FBS_CORS_ORIGINS",
    "http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:4173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in CORS_ORIGINS if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SecurityHeadersMiddleware)

# Routers bajo prefijo /api
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(proyectos.router, prefix="/api/proyectos", tags=["proyectos"])
app.include_router(documentos.router, prefix="/api/documentos", tags=["documentos"])
app.include_router(eventos.router, prefix="/api/eventos", tags=["eventos"])
app.include_router(reportes.router, prefix="/api/reportes", tags=["reportes"])

register_spec_error_handlers(app)


@app.on_event("startup")
def startup():
    init_db()
    seed_data()


@app.get("/api/health", tags=["health"])
def health():
    try:
        with get_conn() as conn:
            conn.execute("SELECT 1").fetchone()
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        return {"status": "error", "db": str(e)}


DIST_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(DIST_DIR):
    app.mount("/", StaticFiles(directory=DIST_DIR, html=True), name="static")
```

---

## 3. backend/routers/auth.py — MODIFICAR

### 3.1 Agregar `import time` al inicio:

```python
import os
import sqlite3
import time
from datetime import datetime, timedelta, timezone
```

### 3.2 Reemplazar la seccion de SECRET_KEY y ALGORITHM:

```python
SECRET_KEY = os.environ.get("JWT_SECRET")
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET environment variable is required. Set it before starting the server.")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("JWT_EXPIRE_MINUTES", "1440"))  # 24h por defecto
```

### 3.3 Agregar rate limiting antes de la funcion `login`:

```python
# Rate limiting en memoria: {ip: {"count": int, "first": timestamp}}
_login_attempts: dict = {}
MAX_LOGIN_ATTEMPTS = 3
LOGIN_WINDOW_SECONDS = 60


def _check_rate_limit(ip: str):
    now = time.time()
    entry = _login_attempts.get(ip)
    if entry:
        if now - entry["first"] > LOGIN_WINDOW_SECONDS:
            _login_attempts[ip] = {"count": 1, "first": now}
            return
        if entry["count"] >= MAX_LOGIN_ATTEMPTS:
            raise HTTPException(
                status_code=429,
                detail="Demasiados intentos de login. Espera 1 minuto."
            )
        entry["count"] += 1
    else:
        _login_attempts[ip] = {"count": 1, "first": now}


def _get_client_ip(request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
```

### 3.4 Modificar la funcion `login` para usar rate limiting:

Reemplazar la firma y cuerpo de `login`:

```python
@router.post("/login", response_model=Token)
def login(data: LoginIn, request: Request):
    """Login con JSON. Devuelve JWT. Rate limit: 3 intentos por minuto por IP."""
    ip = _get_client_ip(request)
    _check_rate_limit(ip)

    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM usuarios WHERE username = ?",
            (data.username,)
        ).fetchone()

    if not row or not verify_password(data.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="credenciales invalidas")

    access_token = create_access_token(data={"sub": str(row["id"])})
    return {"access_token": access_token, "token_type": "bearer"}
```

Nota: `Request` debe importarse de `fastapi`.

### 3.5 Agregar import de Request:

```python
from fastapi import APIRouter, HTTPException, Depends, status, Request
```

---

## 4. scripts/start.sh (CREAR)

Script nativo para macOS. Hace build del frontend, backup de la BD, y levanta uvicorn.

```bash
#!/usr/bin/env bash
set -e

# FBS Start Script para macOS (MacBook Air 7,2 compatible)
# No requiere Docker. Consume ~150MB RAM total.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Configuracion por defecto (sobrescribible via env)
export FBS_DB_PATH="${FBS_DB_PATH:-$HOME/.fbs/fbs.db}"
export FBS_HISTORIAL_PATH="${FBS_HISTORIAL_PATH:-$HOME/.fbs/registro/historial.jsonl}"
export JWT_SECRET="${JWT_SECRET:?Error: JWT_SECRET no esta definida}"
export FBS_CORS_ORIGINS="${FBS_CORS_ORIGINS:-http://localhost:8000,http://127.0.0.1:8000}"
export JWT_EXPIRE_MINUTES="${JWT_EXPIRE_MINUTES:-1440}"
export UVICORN_PORT="${UVICORN_PORT:-8000}"

mkdir -p "$(dirname "$FBS_DB_PATH")"
mkdir -p "$(dirname "$FBS_HISTORIAL_PATH")"

echo "=== FBS Proyecto ==="
echo "BD: $FBS_DB_PATH"
echo "Registro: $FBS_HISTORIAL_PATH"
echo "Puerto: $UVICORN_PORT"
echo ""

# Backup de la BD si existe
if [ -f "$FBS_DB_PATH" ]; then
    BACKUP_DIR="$(dirname "$FBS_DB_PATH")/backups"
    mkdir -p "$BACKUP_DIR"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    cp "$FBS_DB_PATH" "$BACKUP_DIR/fbs_$TIMESTAMP.db"
    echo "Backup creado: backups/fbs_$TIMESTAMP.db"
fi

# Build del frontend (requiere Node.js instalado)
if command -v npm &> /dev/null; then
    echo "Building frontend..."
    cd "$PROJECT_DIR/frontend"
    npm install --silent
    npm run build
    echo "Frontend listo en frontend/dist/"
else
    echo "WARNING: npm no encontrado. El frontend no se construira."
    echo "Instala Node.js o usa el frontend en modo dev con 'npm run dev' en otra terminal."
fi

echo ""
echo "Iniciando servidor en http://localhost:$UVICORN_PORT"
echo "Presiona Ctrl+C para detener."
echo ""

cd "$PROJECT_DIR"
exec uvicorn backend.main:app --host 0.0.0.0 --port "$UVICORN_PORT" --workers 1
```

Hacer ejecutable:

```bash
chmod +x scripts/start.sh
```

---

## 5. scripts/backup.sh (CREAR)

```bash
#!/usr/bin/env bash
set -e

DB_PATH="${FBS_DB_PATH:-$HOME/.fbs/fbs.db}"
BACKUP_DIR="$(dirname "$DB_PATH")/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

cp "$DB_PATH" "$BACKUP_DIR/fbs_$TIMESTAMP.db"
ls -t "$BACKUP_DIR"/fbs_*.db | tail -n +11 | xargs rm -f 2>/dev/null || true

echo "Backup creado: $BACKUP_DIR/fbs_$TIMESTAMP.db"
echo "Retencion: ultimos 10 backups"
```

Hacer ejecutable:

```bash
chmod +x scripts/backup.sh
```

---

## 6. .env.example (CREAR)

```bash
# Copiar a .env y rellenar valores reales
JWT_SECRET=cambia-esto-por-una-clave-larga-y-segura-de-32-caracteres
FBS_DB_PATH=/Users/tu-usuario/.fbs/fbs.db
FBS_HISTORIAL_PATH=/Users/tu-usuario/.fbs/registro/historial.jsonl
FBS_CORS_ORIGINS=http://localhost:8000,http://127.0.0.1:8000
JWT_EXPIRE_MINUTES=1440
UVICORN_PORT=8000
```

---

## 7. backend/tests/test_api_produccion.py (CREAR)

```python
import os
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


class TestHealthCheck:
    def test_health_incluye_db(self):
        # Asegurar que JWT_SECRET esta set para que la app arranque
        os.environ["JWT_SECRET"] = "test-secret-key-32-chars-long"
        r = client.get("/api/health")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert data["db"] == "connected"


class TestRateLimit:
    @pytest.fixture(autouse=True)
    def setup(self):
        os.environ["JWT_SECRET"] = "test-secret-key-32-chars-long"
        from backend.routers import auth as auth_module
        auth_module._login_attempts.clear()

        from backend.database import get_conn
        with get_conn() as conn:
            conn.execute("DELETE FROM usuarios WHERE username != 'admin'")
            count = conn.execute("SELECT COUNT(*) FROM usuarios WHERE username = 'admin'").fetchone()[0]
            if count == 0:
                from backend.routers.auth import get_password_hash
                conn.execute(
                    "INSERT INTO usuarios (username, email, password_hash, rol) VALUES (?, ?, ?, ?)",
                    ("admin", "admin@fbs.local", get_password_hash("admin123"), "admin"),
                )

    def test_login_exitoso_no_bloquea(self):
        r = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_login_fallido_repetido_bloquea(self):
        # 3 intentos fallidos
        for _ in range(3):
            r = client.post("/api/auth/login", json={"username": "admin", "password": "mala"})
            assert r.status_code == 401

        # 4to intento debe ser 429
        r = client.post("/api/auth/login", json={"username": "admin", "password": "mala"})
        assert r.status_code == 429
        assert "Demasiados intentos" in r.json()["detail"]

    def test_login_exitoso_despues_de_bloqueo_no_funciona_inmediatamente(self):
        # Bloquear
        for _ in range(3):
            client.post("/api/auth/login", json={"username": "admin", "password": "mala"})
        r = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        assert r.status_code == 429
```

---

## 8. README.md — MODIFICAR

Reemplazar TODO el contenido del README.md con:

```markdown
# FBS — Gestion de Proyectos y Documentos

Sistema de gestion de proyectos de ingenieria con maquinas de estado, auditoria de eventos, reportes con graficos y exportacion CSV.

**Version:** 1.5.0  
**Stack:** FastAPI + SQLite + React + TypeScript + Vite + Recharts

---

## Requisitos (MacBook Air 7,2 compatible)

- Python 3.11+
- Node.js 18+ (solo para build del frontend)
- ~200MB RAM en ejecucion (sin Docker)

## Instalacion rapida

```bash
git clone https://github.com/franciscoburgoss-spec/fbs-proyecto.git
cd fbs-proyecto
pip install -r requirements.txt
```

## Configuracion

```bash
cp .env.example .env
# Edita .env y define al menos JWT_SECRET
```

## Inicio en produccion local (nativo, sin Docker)

```bash
# 1. Setear variables de entorno
export JWT_SECRET="tu-clave-segura-de-32-caracteres-aqui"

# 2. Ejecutar script nativo (build + backup + servidor)
./scripts/start.sh
```

El servidor estara disponible en `http://localhost:8000`.

El frontend estatico se sirve desde el mismo proceso de FastAPI (no requiere `npm run dev`).

## Desarrollo (frontend en modo watch)

Si estas modificando el frontend y necesitas hot-reload:

```bash
# Terminal 1: backend
export JWT_SECRET="dev-secret-key"
uvicorn backend.main:app --reload --port 8000

# Terminal 2: frontend dev server
cd frontend
npm install
npm run dev
# Abre http://localhost:5173
```

## Backup manual de la base de datos

```bash
./scripts/backup.sh
```

## Tests

```bash
pytest backend/tests/ -v
```

## Endpoints principales

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | /api/health | Health check (incluye estado de DB) |
| POST | /api/auth/login | Login con rate limiting (3 intentos/min) |
| GET | /api/proyectos | Listar proyectos |
| GET | /api/proyectos/{id}/detail | Detalle completo con estadisticas |
| GET | /api/reportes/general | Dashboard general |
| GET | /api/reportes/export/csv | Exportar proyectos o documentos |

## Seguridad incluida

- JWT_SECRET obligatorio (sin fallback)
- Rate limiting en login: 3 intentos por minuto por IP
- Headers de seguridad HTTP (X-Frame-Options, X-Content-Type-Options, etc.)
- CORS configurable via `FBS_CORS_ORIGINS`
```

---

## Archivos existentes (NO MODIFICAR salvo lo indicado arriba)

```
spec_engine/
specs/
backend/domain/
backend/database.py
backend/registro.py
backend/routers/__init__.py
backend/routers/proyectos.py
backend/routers/documentos.py
backend/routers/eventos.py
backend/routers/reportes.py
backend/schemas/
backend/tests/test_api_auth.py
backend/tests/test_api_admin.py
backend/tests/test_api_eventos.py
backend/tests/test_api_reportes.py
backend/tests/test_api_proyectos.py
backend/tests/test_api_documentos.py
backend/tests/test_api_proyecto_detalle.py
backend/tests/test_database.py
backend/tests/test_*transitions.py
frontend/src/components/LoginPage.tsx
frontend/src/components/AdminPage.tsx
frontend/src/components/PerfilPage.tsx
frontend/src/components/AuditoriaPage.tsx
frontend/src/components/Dashboard.tsx
frontend/src/components/ExportButton.tsx
frontend/src/components/ProyectoList.tsx
frontend/src/components/ProyectoDetail.tsx
frontend/src/components/DocumentoList.tsx
frontend/src/hooks/*.ts
frontend/src/context/AuthContext.tsx
frontend/src/App.tsx
frontend/src/main.tsx
frontend/src/types.ts
frontend/src/api.ts
frontend/src/vite.config.ts
frontend/src/tsconfig*.json
frontend/package.json
frontend/index.html
Dockerfile.backend
Dockerfile.frontend
docker-compose.yml
```

---

## Invariantes a respetar

| Inv | Texto | Como se verifica |
|-----|-------|------------------|
| I-5  | Frontend puede consumir API | CORS permite origenes configurados, StaticFiles sirve build si existe |
| I-6  | Separacion backend/frontend | Build estatico se genera una vez, backend solo sirve archivos |
| I-8  | Todos los endpoints protegidos | `/detail`, `/reportes`, `/eventos` siguen con auth. `/health` permanece publico |
| I-9  | Navegacion funcional | React Router maneja rutas via SPA, StaticFiles con `html=True` sirve `index.html` para cualquier ruta no API |
| I-11 | JWT_SECRET sin fallback | `auth.py` lanza `RuntimeError` si no esta definida; tests verifican arranque |
| I-12 | Rate limiting funciona | `test_api_produccion.py` verifica 429 despues de 3 intentos fallidos |

---

## Notas de implementacion

1. **No usar Docker en la MacBook Air 7,2.** Docker Desktop consume ~2GB de RAM solo en la VM. El script `start.sh` ejecuta todo nativamente con ~150MB de RAM.

2. **El build del frontend** (`npm run build`) genera `frontend/dist/`. FastAPI monta este directorio con `StaticFiles(html=True)`, lo que permite que React Router funcione correctamente (cualquier ruta no API devuelve `index.html`).

3. **Rate limiting en memoria** es suficiente para uso personal (1 usuario). No requiere Redis. Se reinicia con el servidor.

4. **Backup automatico:** `start.sh` copia la BD antes de iniciar. `backup.sh` mantiene los ultimos 10 backups.

5. **JWT_SECRET obligatorio:** Si no esta definida, el servidor no arranca. Esto evita que la app quede expuesta con una clave por defecto.

6. **Health check:** El endpoint `/api/health` ahora ejecuta `SELECT 1` en la BD. Si falla, devuelve status 200 con `"status": "error"` (para que un proxy/reverse proxy no marque como caido, pero el operador ve el problema en el JSON).

7. **Version:** Cambiar la version de FastAPI a `1.5.0` en `main.py` para reflejar la sesion 9.
