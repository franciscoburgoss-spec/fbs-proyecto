import pytest
import os
from backend.database import get_conn, init_db, seed_data, DB_PATH as _ORIGINAL_DB_PATH


@pytest.fixture(autouse=True)
def setup_db(tmp_path_factory, monkeypatch):
    # DB unica por test para evitar conflictos entre tests concurrentes
    test_db_path = str(tmp_path_factory.mktemp("db") / "test.db")
    os.environ["FBS_DB_PATH"] = test_db_path
    # Parchamos DB_PATH en el modulo para que los tests de API usen la misma DB
    import backend.database
    monkeypatch.setattr(backend.database, "DB_PATH", test_db_path)
    init_db()
    seed_data()
    yield
    # cleanup: tmp_path_factory maneja la limpieza del directorio temporal


@pytest.fixture
def conn():
    with get_conn() as c:
        yield c
