# Contexto Sesion 2 — API REST + Routers + Middleware

> **Hardware:** MacBook Air 7,2 · 8GB RAM · 128GB SSD · Python 3.11+ nativo
> **Objetivo:** Exponer el backend como API REST con FastAPI, conectar frontend React vía CORS, manejar errores del spec_engine en HTTP, tests de integración de endpoints.
> **Tiempo estimado:** 2 horas.

---

## Estado previo (ya existe)

Todo lo de la Sesion 1 esta implementado y verificado:
- `spec_engine/` completo con loader, validator, linter, generators, cli_lint.
- `specs/documento.yaml` y `specs/proyecto.yaml` con maquinas de estado.
- `backend/database.py` con SQLite WAL, schemas, seed data (3 proyectos, 17 documentos).
- `backend/registro.py` con emisor JSONL.
- `backend/schemas/` con Pydantic models (DocumentoOut/In/TransicionIn, ProyectoOut/In/Update).
- `backend/domain/` con documento_engine.py y proyecto_engine.py (validators cacheados, guards reales en proyecto).
- `backend/tests/` con 46 tests pasando (16 documento + 25 proyecto + 5 DB).

**El frontend React existe** en `/frontend/src/` con layout hibrido, consume mock data. Tiene componentes visuales, hooks, modales, tipos. Para esta sesion se conectara al backend.

---

## Archivos a crear en esta sesion

```
backend/
  main.py
  routers/
    proyectos.py
    documentos.py
  middleware/
    spec_errors.py
  tests/
    test_api_proyectos.py
    test_api_documentos.py
requirements.txt  (actualizado con fastapi)
README.md
```

---

## 1. backend/main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import init_db, seed_data
from backend.routers import proyectos, documentos
from backend.middleware.spec_errors import register_spec_error_handlers

app = FastAPI(
    title="FBS API",
    version="1.0.0",
    description="Backend de gestion de proyectos y documentos con spec_engine",
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
app.include_router(proyectos.router, prefix="/api/proyectos", tags=["proyectos"])
app.include_router(documentos.router, prefix="/api/documentos", tags=["documentos"])

# Manejadores de excepciones del spec_engine
register_spec_error_handlers(app)


@app.on_event("startup")
def startup():
    init_db()
    seed_data()


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok"}
```

---

## 2. backend/routers/proyectos.py

```python
from fastapi import APIRouter, HTTPException
from typing import List

from backend.database import get_conn
from backend.schemas.proyecto import ProyectoOut, ProyectoIn, ProyectoUpdate
from backend.domain.proyecto_engine import get_validator
from backend.registro import emit_evento
from spec_engine.validator import TransitionError

router = APIRouter()


@router.get("", response_model=List[ProyectoOut])
def listar_proyectos():
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM proyectos ORDER BY fecha_creacion DESC"
        ).fetchall()
    return [dict(r) for r in rows]


@router.get("/{id}", response_model=ProyectoOut)
def obtener_proyecto(id: int):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM proyectos WHERE id = ?", (id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="proyecto no encontrado")
    return dict(row)


@router.post("", response_model=ProyectoOut, status_code=201)
def crear_proyecto(data: ProyectoIn):
    with get_conn() as conn:
        cursor = conn.execute(
            """
            INSERT INTO proyectos (nombre, acronimo, descripcion, cliente, ubicacion)
            VALUES (?, ?, ?, ?, ?)
            """,
            (data.nombre, data.acronimo, data.descripcion, data.cliente, data.ubicacion),
        )
        proyecto_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM proyectos WHERE id = ?", (proyecto_id,)).fetchone()

    emit_evento("proyecto_creado", proyecto_id=proyecto_id, acronimo=data.acronimo)
    return dict(row)


@router.patch("/{id}", response_model=ProyectoOut)
def actualizar_proyecto(id: int, data: ProyectoUpdate):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM proyectos WHERE id = ?", (id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="proyecto no encontrado")

        # Solo actualizar campos enviados (no nulos)
        campos = []
        valores = []
        for campo in ["nombre", "descripcion", "cliente", "ubicacion"]:
            val = getattr(data, campo)
            if val is not None:
                campos.append(f"{campo} = ?")
                valores.append(val)

        if campos:
            valores.append(id)
            conn.execute(
                f"UPDATE proyectos SET {', '.join(campos)}, fecha_modificacion = datetime('now') WHERE id = ?",
                valores,
            )
            row = conn.execute("SELECT * FROM proyectos WHERE id = ?", (id,)).fetchone()

    emit_evento("proyecto_actualizado", proyecto_id=id, campos=campos)
    return dict(row)


@router.delete("/{id}", status_code=204)
def eliminar_proyecto(id: int):
    with get_conn() as conn:
        row = conn.execute("SELECT id FROM proyectos WHERE id = ?", (id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="proyecto no encontrado")

        # ON DELETE CASCADE no esta habilitado en SQLite por default sin FK enforcement
        # Pero ejecutamos PRAGMA foreign_keys=ON en get_conn, asi que si hay docs fallara
        try:
            conn.execute("DELETE FROM proyectos WHERE id = ?", (id,))
        except Exception:
            raise HTTPException(status_code=409, detail="no se puede eliminar: tiene documentos asociados")

    emit_evento("proyecto_eliminado", proyecto_id=id)
    return None


@router.post("/{id}/transicion", response_model=ProyectoOut)
def transicionar_proyecto(id: int, body: dict):
    """Body esperado: {'a': 'R1'} — la etapa destino."""
    destino = body.get("a")
    if not destino:
        raise HTTPException(status_code=422, detail="falta campo 'a' con estado destino")

    with get_conn() as conn:
        row = conn.execute("SELECT * FROM proyectos WHERE id = ?", (id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="proyecto no encontrado")

        origen = row["etapa_actual"]

        # Validar transicion via spec_engine
        validar = get_validator()
        try:
            t = validar(origen, destino, ctx={"proyecto_id": id, "etapa_actual": origen})
        except TransitionError as e:
            raise HTTPException(status_code=e.http, detail={"code": e.code, "details": e.details})

        # Actualizar estado
        conn.execute(
            "UPDATE proyectos SET etapa_actual = ?, fecha_modificacion = datetime('now') WHERE id = ?",
            (destino, id),
        )
        row = conn.execute("SELECT * FROM proyectos WHERE id = ?", (id,)).fetchone()

    emit_evento(
        t["event"],
        entity="proyecto",
        proyecto_id=id,
        from_state=origen,
        to_state=destino,
    )
    return dict(row)
```

---

## 3. backend/routers/documentos.py

```python
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Literal

from backend.database import get_conn
from backend.schemas.documento import DocumentoOut, DocumentoIn, TransicionIn
from backend.domain.documento_engine import get_validator
from backend.registro import emit_evento
from spec_engine.validator import TransitionError

router = APIRouter()


@router.get("", response_model=List[DocumentoOut])
def listar_documentos(
    proyecto_id: Optional[int] = Query(None),
    etapa: Optional[Literal["CHK", "R1", "R2", "R3"]] = Query(None),
    estado: Optional[Literal["ING", "OBS", "COR", "APB"]] = Query(None),
    modulo: Optional[Literal["EST", "HAB", "MDS"]] = Query(None),
):
    query = "SELECT * FROM documentos WHERE 1=1"
    params = []
    if proyecto_id is not None:
        query += " AND proyecto_id = ?"
        params.append(proyecto_id)
    if etapa:
        query += " AND etapa = ?"
        params.append(etapa)
    if estado:
        query += " AND estado = ?"
        params.append(estado)
    if modulo:
        query += " AND modulo = ?"
        params.append(modulo)
    query += " ORDER BY fecha_creacion DESC"

    with get_conn() as conn:
        rows = conn.execute(query, params).fetchall()
    return [dict(r) for r in rows]


@router.get("/{id}", response_model=DocumentoOut)
def obtener_documento(id: int):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM documentos WHERE id = ?", (id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="documento no encontrado")
    return dict(row)


@router.post("", response_model=DocumentoOut, status_code=201)
def crear_documento(data: DocumentoIn, proyecto_id: int):
    """Crea un documento asociado a un proyecto. La etapa se hereda del proyecto."""
    with get_conn() as conn:
        # Verificar que el proyecto existe
        proyecto = conn.execute("SELECT etapa_actual FROM proyectos WHERE id = ?", (proyecto_id,)).fetchone()
        if not proyecto:
            raise HTTPException(status_code=404, detail="proyecto no encontrado")

        etapa = proyecto["etapa_actual"]

        cursor = conn.execute(
            """
            INSERT INTO documentos (proyecto_id, nombre, modulo, etapa, estado, tipo, tt, nn)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (proyecto_id, data.nombre, data.modulo, etapa, "ING", data.tipo, data.tt, data.nn),
        )
        doc_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM documentos WHERE id = ?", (doc_id,)).fetchone()

    emit_evento(
        "documento_creado",
        documento_id=doc_id,
        proyecto_id=proyecto_id,
        modulo=data.modulo,
        etapa=etapa,
    )
    return dict(row)


@router.patch("/{id}", response_model=DocumentoOut)
def actualizar_documento(id: int, data: dict):
    """Permite actualizar nombre, tipo, tt, nn. Estado y etapa via transicion."""
    campos_permitidos = {"nombre", "tipo", "tt", "nn"}
    campos = []
    valores = []
    for k, v in data.items():
        if k in campos_permitidos and v is not None:
            campos.append(f"{k} = ?")
            valores.append(v)

    if not campos:
        raise HTTPException(status_code=422, detail="no se envio ningun campo editable")

    with get_conn() as conn:
        row = conn.execute("SELECT * FROM documentos WHERE id = ?", (id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="documento no encontrado")

        valores.append(id)
        conn.execute(
            f"UPDATE documentos SET {', '.join(campos)}, fecha_modificacion = datetime('now') WHERE id = ?",
            valores,
        )
        row = conn.execute("SELECT * FROM documentos WHERE id = ?", (id,)).fetchone()

    emit_evento("documento_actualizado", documento_id=id, campos=list(data.keys()))
    return dict(row)


@router.delete("/{id}", status_code=204)
def eliminar_documento(id: int):
    with get_conn() as conn:
        row = conn.execute("SELECT id FROM documentos WHERE id = ?", (id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="documento no encontrado")
        conn.execute("DELETE FROM documentos WHERE id = ?", (id,))

    emit_evento("documento_eliminado", documento_id=id)
    return None


@router.post("/{id}/transicion", response_model=DocumentoOut)
def transicionar_documento(id: int, body: TransicionIn):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM documentos WHERE id = ?", (id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="documento no encontrado")

        origen = row["estado"]
        destino = body.a

        # Validar via spec_engine
        validar = get_validator()
        try:
            t = validar(origen, destino, payload=body.payload)
        except TransitionError as e:
            raise HTTPException(status_code=e.http, detail={"code": e.code, "details": e.details})

        # Si la transicion lleva a OBS, guardar observacion del payload
        observacion = None
        if destino == "OBS" and body.payload and "observacion" in body.payload:
            observacion = body.payload["observacion"]

        conn.execute(
            """
            UPDATE documentos SET estado = ?, observacion = ?, fecha_modificacion = datetime('now') WHERE id = ?
            """,
            (destino, observacion, id),
        )
        row = conn.execute("SELECT * FROM documentos WHERE id = ?", (id,)).fetchone()

    emit_evento(
        t["event"],
        entity="documento",
        documento_id=id,
        proyecto_id=row["proyecto_id"],
        from_state=origen,
        to_state=destino,
        observacion=observacion,
    )
    return dict(row)
```

---

## 4. backend/middleware/spec_errors.py

```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from spec_engine.validator import TransitionError


def register_spec_error_handlers(app: FastAPI):
    @app.exception_handler(TransitionError)
    async def transition_error_handler(request: Request, exc: TransitionError):
        return JSONResponse(
            status_code=exc.http,
            content={"error": exc.code, "details": exc.details},
        )
```

---

## 5. backend/tests/test_api_proyectos.py

```python
import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_db():
    # El conftest ya maneja setup_db, pero aseguramos que /api/health responde
    pass


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_listar_proyectos():
    r = client.get("/api/proyectos")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 3
    assert all("acronimo" in p for p in data)


def test_obtener_proyecto():
    r = client.get("/api/proyectos/1")
    assert r.status_code == 200
    assert r.json()["nombre"] == "Proyecto Norte"


def test_obtener_proyecto_404():
    r = client.get("/api/proyectos/9999")
    assert r.status_code == 404


def test_crear_proyecto():
    payload = {
        "nombre": "Proyecto Nuevo",
        "acronimo": "NUEVO-99",
        "descripcion": "Desc",
        "cliente": "Cliente X",
        "ubicacion": "Zona X",
    }
    r = client.post("/api/proyectos", json=payload)
    assert r.status_code == 201
    data = r.json()
    assert data["nombre"] == "Proyecto Nuevo"
    assert data["etapa_actual"] == "CHK"  # default


def test_crear_proyecto_acronimo_duplicado():
    payload = {"nombre": "X", "acronimo": "NORTE-01"}
    r = client.post("/api/proyectos", json=payload)
    assert r.status_code == 500  # SQLiteIntegrityError -> 500 (sin handler especifico)


def test_actualizar_proyecto():
    r = client.patch("/api/proyectos/1", json={"nombre": "Renombrado"})
    assert r.status_code == 200
    assert r.json()["nombre"] == "Renombrado"


def test_actualizar_proyecto_no_permitido():
    # acronimo no esta en ProyectoUpdate, asi que simplemente se ignora si se manda
    # o da 422 si FastAPI valida extra fields. Con Pydantic v2 default es ignore.
    r = client.patch("/api/proyectos/1", json={"acronimo": "HACK"})
    # Si ProyectoUpdate no tiene acronimo, Pydantic v2 lo ignora (por defecto)
    # y no actualiza nada. Status 200 con datos sin cambio.
    assert r.status_code == 200


def test_eliminar_proyecto_con_documentos_falla():
    r = client.delete("/api/proyectos/1")
    assert r.status_code == 409


def test_transicion_proyecto_valida():
    # Proyecto 3 esta en CHK, todos sus docs estan en ING (no APB)
    # El guard 'todos_docs_etapa_apb' fallara porque los docs de CHK no estan APB
    r = client.post("/api/proyectos/3/transicion", json={"a": "R1"})
    # Esperamos 409 o 422 segun el guard
    assert r.status_code in (409, 422)
    assert "error" in r.json()["detail"] or "code" in r.json()["detail"]


def test_transicion_proyecto_invalida():
    r = client.post("/api/proyectos/1/transicion", json={"a": "CHK"})
    # CHK -> no es transicion valida desde R2
    assert r.status_code == 422
```

---

## 6. backend/tests/test_api_documentos.py

```python
import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_listar_documentos():
    r = client.get("/api/documentos")
    assert r.status_code == 200
    assert len(r.json()) == 17


def test_listar_documentos_filtro_proyecto():
    r = client.get("/api/documentos?proyecto_id=1")
    assert r.status_code == 200
    assert len(r.json()) == 12  # Proyecto Norte tiene 12 docs


def test_listar_documentos_filtro_modulo():
    r = client.get("/api/documentos?modulo=EST")
    assert r.status_code == 200
    data = r.json()
    assert all(d["modulo"] == "EST" for d in data)


def test_obtener_documento():
    r = client.get("/api/documentos/1")
    assert r.status_code == 200
    assert r.json()["nombre"] == "Plan de Manejo Ambiental"


def test_obtener_documento_404():
    r = client.get("/api/documentos/9999")
    assert r.status_code == 404


def test_crear_documento():
    payload = {
        "nombre": "Nuevo Doc",
        "modulo": "EST",
        "tipo": "PDF",
        "tt": "01",
        "nn": "99",
    }
    r = client.post("/api/documentos?proyecto_id=1", json=payload)
    assert r.status_code == 201
    data = r.json()
    assert data["nombre"] == "Nuevo Doc"
    assert data["etapa"] == "R2"  # hereda etapa del proyecto 1 (R2)
    assert data["estado"] == "ING"


def test_crear_documento_proyecto_inexistente():
    payload = {"nombre": "X", "modulo": "EST", "tipo": "PDF", "tt": "01", "nn": "01"}
    r = client.post("/api/documentos?proyecto_id=9999", json=payload)
    assert r.status_code == 404


def test_actualizar_documento():
    r = client.patch("/api/documentos/1", json={"nombre": "Renombrado"})
    assert r.status_code == 200
    assert r.json()["nombre"] == "Renombrado"


def test_transicion_documento_valida():
    # Doc 1 esta en APB, no puede transicionar
    # Doc 16 (Estudio Central) esta en ING, puede ir a OBS
    r = client.post("/api/documentos/16/transicion", json={"a": "OBS", "payload": {"observacion": "Falta revision"}})
    assert r.status_code == 200
    data = r.json()
    assert data["estado"] == "OBS"
    assert data["observacion"] == "Falta revision"


def test_transicion_documento_invalida():
    # Doc 1 esta en APB, no puede ir a ING
    r = client.post("/api/documentos/1/transicion", json={"a": "ING"})
    assert r.status_code == 422
    detail = r.json()["detail"]
    assert detail["code"] == "DOC_TRANSITION_INVALID"


def test_transicion_documento_payload_faltante():
    # ING -> OBS requiere observacion
    r = client.post("/api/documentos/16/transicion", json={"a": "OBS"})
    # Nota: el doc 16 ya esta en OBS por test anterior si no se resetea
    # Pero conftest hace reset por autouse, asi que vuelve a ING
    assert r.status_code == 422
    assert "observacion" in str(r.json()["detail"])


def test_eliminar_documento():
    r = client.delete("/api/documentos/17")
    assert r.status_code == 204
    r2 = client.get("/api/documentos/17")
    assert r2.status_code == 404
```

---

## 7. requirements.txt

```
pyyaml>=6.0
pydantic>=2.0
pytest>=7.0
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
httpx>=0.25.0          # TestClient de FastAPI lo necesita
```

Instalar: `pip install -r requirements.txt`

---

## 8. README.md

```markdown
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
```

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

---

## Checklist de verificacion final

```bash
# 1. Servidor arranca
uvicorn backend.main:app --reload --port 8000 &
sleep 2
curl http://localhost:8000/api/health

# 2. Tests de API
pytest backend/tests/test_api_proyectos.py -v
pytest backend/tests/test_api_documentos.py -v

# 3. Suite completa
pytest backend/tests/ -v              # esperado: 60+ pasando

# 4. Registro JSONL tiene eventos
cat registro/historial.jsonl | wc -l  # esperado: > 0
```

---

## Notas para el agente

- El `TransicionIn` de documento usa `payload: Optional[dict]`, y el router extrae `observacion` cuando destino es OBS.
- Los guards de proyecto_engine acceden a la DB real, por eso los tests de transicion de proyecto daran 409 cuando los docs no estan todos APB.
- Para evitar que TestClient comparta estado de lru_cache entre tests, considerar limpiar caches si hay problemas (`get_validator.cache_clear()`).
- `init_db()` y `seed_data()` se ejecutan en el startup event de FastAPI. Para tests, `conftest.py` ya maneja la DB separada (test_fbs.db).
- El middleware `spec_errors.py` registra un `exception_handler` para `TransitionError`. Nota: FastAPI >= 0.104 con Pydantic v2 requiere que `TransitionError` herede de `Exception` (lo hace, ya que `Exception` es base de `Exception` por `@dataclass` con herencia).
- Los routers de documentos reciben `proyecto_id` como query param en POST para mantener REST simple (alternativa: subresource `/api/proyectos/{pid}/documentos` que podria agregarse en sesion 3).
- NO crear `backend/main.py` con auth ni JWT en esta sesion (va en sesion 3 si se requiere).
