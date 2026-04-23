import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


class TestAuth:
    @pytest.fixture(autouse=True)
    def setup(self):
        """Limpiar usuarios antes de cada test (excepto admin del seed)."""
        from backend.database import get_conn
        with get_conn() as conn:
            conn.execute("DELETE FROM usuarios WHERE username != 'admin'")

    def test_login_admin_seed(self):
        """El usuario admin del seed puede hacer login."""
        r = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_credenciales_invalidas(self):
        r = client.post("/api/auth/login", json={"username": "admin", "password": "wrong"})
        assert r.status_code == 401

    def test_registro_usuario_nuevo(self):
        r = client.post("/api/auth/register", json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpass123"
        })
        assert r.status_code == 201
        data = r.json()
        assert data["username"] == "testuser"
        assert data["rol"] == "user"

    def test_registro_username_duplicado(self):
        client.post("/api/auth/register", json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpass123"
        })
        r = client.post("/api/auth/register", json={
            "username": "testuser",
            "email": "otro@example.com",
            "password": "testpass123"
        })
        assert r.status_code == 409

    def test_me_con_token_valido(self):
        login = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        token = login.json()["access_token"]
        r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert r.json()["username"] == "admin"

    def test_me_sin_token(self):
        r = client.get("/api/auth/me")
        assert r.status_code == 401

    def test_me_con_token_invalido(self):
        r = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid_token"})
        assert r.status_code == 401

    def test_acceso_protegido_proyectos_sin_token(self):
        r = client.get("/api/proyectos")
        assert r.status_code == 401

    def test_acceso_protegido_proyectos_con_token(self):
        login = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        token = login.json()["access_token"]
        r = client.get("/api/proyectos", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_primer_usuario_registrado_es_admin(self):
        """Si se limpian todos los usuarios, el primero en registrarse es admin."""
        from backend.database import get_conn
        with get_conn() as conn:
            conn.execute("DELETE FROM usuarios")
        r = client.post("/api/auth/register", json={
            "username": "firstuser",
            "email": "first@example.com",
            "password": "pass123"
        })
        assert r.json()["rol"] == "admin"
