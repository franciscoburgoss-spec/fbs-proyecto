import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.domain.proyecto_engine import get_validator as get_proyecto_validator
from backend.domain.documento_engine import get_validator as get_documento_validator


@pytest.fixture(autouse=True)
def reset_db():
    # Limpiar caches de lru_cache antes de cada test
    get_proyecto_validator.cache_clear()
    get_documento_validator.cache_clear()
    yield


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_listar_proyectos(client):
    r = client.get("/api/proyectos")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 3
    assert all("acronimo" in p for p in data)


def test_obtener_proyecto(client):
    r = client.get("/api/proyectos/1")
    assert r.status_code == 200
    assert r.json()["nombre"] == "Proyecto Norte"


def test_obtener_proyecto_404(client):
    r = client.get("/api/proyectos/9999")
    assert r.status_code == 404


def test_crear_proyecto(client):
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


def test_crear_proyecto_acronimo_duplicado(client):
    payload = {"nombre": "X", "acronimo": "NORTE-01"}
    r = client.post("/api/proyectos", json=payload)
    assert r.status_code == 409  # SQLiteIntegrityError -> 409 Conflict


def test_actualizar_proyecto(client):
    r = client.patch("/api/proyectos/1", json={"nombre": "Renombrado"})
    assert r.status_code == 200
    assert r.json()["nombre"] == "Renombrado"


def test_actualizar_proyecto_no_permitido(client):
    # acronimo no esta en ProyectoUpdate, asi que simplemente se ignora si se manda
    # o da 422 si FastAPI valida extra fields. Con Pydantic v2 default es ignore.
    r = client.patch("/api/proyectos/1", json={"acronimo": "HACK"})
    # Si ProyectoUpdate no tiene acronimo, Pydantic v2 lo ignora (por defecto)
    # y no actualiza nada. Status 200 con datos sin cambio.
    assert r.status_code == 200


def test_eliminar_proyecto_con_documentos_falla(client):
    r = client.delete("/api/proyectos/1")
    assert r.status_code == 409


def test_transicion_proyecto_valida(client):
    # Proyecto 3 esta en CHK, todos sus docs estan en ING (no APB)
    # El guard 'todos_docs_etapa_apb' fallara porque los docs de CHK no estan APB
    r = client.post("/api/proyectos/3/transicion", json={"a": "R1"})
    # Esperamos 409 o 422 segun el guard
    assert r.status_code in (409, 422)
    assert "error" in r.json()["detail"] or "code" in r.json()["detail"]


def test_transicion_proyecto_invalida(client):
    r = client.post("/api/proyectos/1/transicion", json={"a": "CHK"})
    # CHK -> no es transicion valida desde R2
    assert r.status_code == 422
