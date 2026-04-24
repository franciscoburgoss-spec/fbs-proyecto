import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from backend.database import get_conn, init_db, seed_data
from backend.routers import proyectos, documentos, auth, eventos, reportes
from backend.middleware.spec_errors import register_spec_error_handlers
from backend.middleware.security import SecurityHeadersMiddleware

app = FastAPI(
    title="FBS API",
    version="1.5.0",
    description="Backend de gestion de proyectos y documentos con spec_engine, auth JWT, roles, auditoria y reportes",
)

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


# SPA fallback: servir index.html para cualquier ruta que no sea API ni archivo existente
DIST_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa(full_path: str):
    # No servir index.html para rutas de API
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Not Found")
    
    # Si existe el archivo solicitado, servirlo (assets, css, js, etc.)
    file_path = os.path.join(DIST_DIR, full_path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # Por defecto, servir index.html para que React Router maneje la ruta
    index_path = os.path.join(DIST_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    raise HTTPException(status_code=404, detail="Not Found")
