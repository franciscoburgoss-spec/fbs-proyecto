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
        yield
        # Limpiar intentos fallidos tras cada test para no afectar otros tests
        auth_module._login_attempts.clear()

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
