import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


class TestEventos:
    @pytest.fixture(autouse=True)
    def setup(self):
        """Limpiar eventos y usuarios no-admin antes de cada test."""
        from backend.database import get_conn
        with get_conn() as conn:
            conn.execute("DELETE FROM eventos")
            conn.execute("DELETE FROM usuarios WHERE username != 'admin'")

    def _login(self, username, password):
        r = client.post("/api/auth/login", json={"username": username, "password": password})
        assert r.status_code == 200
        return r.json()["access_token"]

    # --- permisos ---

    def test_listar_eventos_sin_token_devuelve_401(self):
        r = client.get("/api/eventos")
        assert r.status_code == 401

    def test_listar_eventos_como_user_devuelve_403(self):
        client.post("/api/auth/register", json={
            "username": "normaluser",
            "email": "normal@example.com",
            "password": "pass123"
        })
        token = self._login("normaluser", "pass123")
        r = client.get("/api/eventos", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 403

    def test_listar_eventos_como_admin_funciona(self):
        admin_token = self._login("admin", "admin123")
        r = client.get("/api/eventos", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    # --- filtros ---

    def test_filtro_por_tipo_evento(self):
        # Crear un proyecto (genera evento proyecto_creado)
        admin_token = self._login("admin", "admin123")
        r = client.post(
            "/api/proyectos",
            json={"nombre": "Test", "acronimo": "TEST-FILTRO"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 201

        # Consultar eventos filtrados
        eventos = client.get(
            "/api/eventos?event=proyecto_creado",
            headers={"Authorization": f"Bearer {admin_token}"},
        ).json()

        assert len(eventos) >= 1
        assert all(e["event"] == "proyecto_creado" for e in eventos)

    def test_filtro_por_rango_fechas(self):
        admin_token = self._login("admin", "admin123")

        # Crear un proyecto
        r = client.post(
            "/api/proyectos",
            json={"nombre": "Test Fechas", "acronimo": "TEST-FCH"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 201

        # Consultar con filtro de fecha futuro (no debe devolver nada)
        eventos = client.get(
            "/api/eventos?desde=2099-01-01T00:00:00",
            headers={"Authorization": f"Bearer {admin_token}"},
        ).json()
        assert len(eventos) == 0

        # Consultar con filtro de fecha pasado (debe devolver algo)
        eventos = client.get(
            "/api/eventos?desde=2000-01-01T00:00:00",
            headers={"Authorization": f"Bearer {admin_token}"},
        ).json()
        assert len(eventos) >= 1

    # --- paginacion ---

    def test_paginacion_limit_offset(self):
        admin_token = self._login("admin", "admin123")

        # Crear varios proyectos para generar eventos
        for i in range(5):
            r = client.post(
                "/api/proyectos",
                json={"nombre": f"Test {i}", "acronimo": f"TEST-PAG-{i}"},
                headers={"Authorization": f"Bearer {admin_token}"},
            )
            assert r.status_code == 201

        # Probar limit
        eventos = client.get(
            "/api/eventos?limit=2",
            headers={"Authorization": f"Bearer {admin_token}"},
        ).json()
        assert len(eventos) <= 2

        # Probar offset
        eventos_offset = client.get(
            "/api/eventos?limit=2&offset=2",
            headers={"Authorization": f"Bearer {admin_token}"},
        ).json()
        assert len(eventos_offset) <= 2

    # --- estadisticas ---

    def test_estadisticas_eventos(self):
        admin_token = self._login("admin", "admin123")

        # Crear un proyecto
        r = client.post(
            "/api/proyectos",
            json={"nombre": "Test Stats", "acronimo": "TEST-ST"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 201

        stats = client.get(
            "/api/eventos/stats",
            headers={"Authorization": f"Bearer {admin_token}"},
        ).json()

        assert "total" in stats
        assert "por_tipo" in stats
        assert isinstance(stats["por_tipo"], list)

    def test_estadisticas_sin_token_devuelve_401(self):
        r = client.get("/api/eventos/stats")
        assert r.status_code == 401

    def test_estadisticas_como_user_devuelve_403(self):
        client.post("/api/auth/register", json={
            "username": "viewer",
            "email": "viewer@example.com",
            "password": "pass123"
        })
        token = self._login("viewer", "pass123")
        r = client.get("/api/eventos/stats", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 403
