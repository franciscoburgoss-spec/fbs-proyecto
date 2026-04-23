from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import init_db, seed_data
from backend.routers import proyectos, documentos, auth
from backend.middleware.spec_errors import register_spec_error_handlers

app = FastAPI(
    title="FBS API",
    version="1.2.0",
    description="Backend de gestion de proyectos y documentos con spec_engine, auth JWT y roles",
)

# CORS para frontend React (puerto 5173 en dev, 4173 en preview)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers bajo prefijo /api
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(proyectos.router, prefix="/api/proyectos", tags=["proyectos"])
app.include_router(documentos.router, prefix="/api/documentos", tags=["documentos"])

register_spec_error_handlers(app)


@app.on_event("startup")
def startup():
    init_db()
    seed_data()


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok"}
