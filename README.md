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

# Hacer ejecutables los scripts nativos (necesario tras clonar)
chmod +x scripts/*.sh

# Ejecutar setup unico (crea venv e instala dependencias)
./scripts/setup-mac.sh
```

## Configuracion

```bash
cp .env.example .env
# Edita .env y define al menos JWT_SECRET
```

## Inicio en produccion local (nativo, sin Docker)

```bash
# 1. Edita .env y define al menos JWT_SECRET (32+ caracteres)
nano .env

# 2. Ejecutar script nativo (carga .env + build + backup + servidor)
./scripts/start.sh
```

El servidor estara disponible en `http://localhost:8000`.

El frontend estatico se sirve desde el mismo proceso de FastAPI (no requiere `npm run dev`).

## Desarrollo (frontend en modo watch)

Si estas modificando el frontend y necesitas hot-reload:

```bash
# Terminal 1: backend (con venv activado)
source .venv/bin/activate
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
source .venv/bin/activate
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
