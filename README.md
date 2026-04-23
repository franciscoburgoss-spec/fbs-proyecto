# FBS — Backend

## Arrancar servidor

```bash
uvicorn backend.main:app --reload --port 8000
```

## Tests

```bash
pytest backend/tests/ -v
```

## Lint specs

```bash
python -m spec_engine.cli_lint specs/
```

## Endpoints principales

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET    | /api/health | Health check |
| GET    | /api/proyectos | Listar proyectos |
| POST   | /api/proyectos | Crear proyecto |
| GET    | /api/proyectos/{id} | Obtener proyecto |
| PATCH  | /api/proyectos/{id} | Actualizar proyecto |
| DELETE | /api/proyectos/{id} | Eliminar proyecto |
| POST   | /api/proyectos/{id}/transicion | Transicionar etapa |
| GET    | /api/documentos | Listar documentos (con filtros) |
| POST   | /api/documentos | Crear documento (query: proyecto_id) |
| GET    | /api/documentos/{id} | Obtener documento |
| PATCH  | /api/documentos/{id} | Actualizar documento |
| DELETE | /api/documentos/{id} | Eliminar documento |
| POST   | /api/documentos/{id}/transicion | Transicionar estado |

---

## Invariantes a respetar

|Inv|Texto|Como se verifica en esta sesion|
|---|-----|------------------------------|
|I-2|API REST consistente|Routers bajo /api/, schemas Pydantic en request/response|
|I-3|Errores del spec_engine se traducen a HTTP|middleware/spec_errors.py captura TransitionError -> JSONResponse|
|I-4|Todo cambio genera evento JSONL|emit_evento() en cada POST/PATCH/DELETE de routers|
|I-5|Frontend puede consumir API|CORS habilitado para localhost:5173/4173|
|I-7|acronimo no se modifica|ProyectoUpdate no incluye acronimo, schema lo ignora|
|I-10|Queries parametrizadas|Todos los execute() en routers usan placeholders ?|
|I-13|Transiciones via spec_engine|routers usan get_validator() de domain engines|
