import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


class TestProyectoDetalle:
    @pytest.fixture(autouse=True)
    def setup(self):
        from backend.database import get_conn
        with get_conn() as conn:
            conn.execute("DELETE FROM eventos")
            conn.execute("DELETE FROM documentos")
            conn.execute("DELETE FROM proyectos")
            conn.execute("DELETE FROM usuarios WHERE username != 'admin'")
            # Insertar proyecto de prueba
            conn.execute(
                "INSERT INTO proyectos (nombre, acronimo, etapa_actual, descripcion, cliente) VALUES (?, ?, ?, ?, ?)",
                ("Proyecto Test", "T-01", "CHK", "Desc", "Cliente X"),
            )
            row = conn.execute("SELECT id FROM proyectos WHERE acronimo = 'T-01'").fetchone()
            self.proyecto_id = row["id"]
            # Insertar documentos
            conn.executemany(
                "INSERT INTO documentos (proyecto_id, nombre, modulo, etapa, estado, tipo, tt, nn) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    (self.proyecto_id, "Doc 1", "EST", "CHK", "ING", "PDF", "01", "01"),
                    (self.proyecto_id, "Doc 2", "EST", "CHK", "APB", "PDF", "01", "02"),
                    (self.proyecto_id, "Doc 3", "HAB", "CHK", "OBS", "PDF", "02", "01"),
                ],
            )

    def _login(self, username, password):
        r = client.post("/api/auth/login", json={"username": username, "password": password})
        assert r.status_code == 200
        return r.json()["access_token"]

    def test_detalle_requiere_auth(self):
        r = client.get(f"/api/proyectos/{self.proyecto_id}/detail")
        assert r.status_code == 401

    def test_detalle_proyecto_existente(self):
        token = self._login("admin", "admin123")
        r = client.get(f"/api/proyectos/{self.proyecto_id}/detail", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        data = r.json()
        assert "proyecto" in data
        assert data["proyecto"]["nombre"] == "Proyecto Test"
        assert "documentos" in data
        assert len(data["documentos"]) == 3
        assert "estadisticas" in data
        assert data["estadisticas"]["total_documentos"] == 3
        assert "eventos_recientes" in data

    def test_detalle_proyecto_inexistente(self):
        token = self._login("admin", "admin123")
        r = client.get("/api/proyectos/99999/detail", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 404

    def test_detalle_observaciones_pendientes(self):
        token = self._login("admin", "admin123")
        r = client.get(f"/api/proyectos/{self.proyecto_id}/detail", headers={"Authorization": f"Bearer {token}"})
        data = r.json()
        obs = data["estadisticas"]["observaciones_pendientes"]
        assert len(obs) == 1
        assert obs[0]["nombre"] == "Doc 3"

    def test_detalle_estadisticas_por_estado(self):
        token = self._login("admin", "admin123")
        r = client.get(f"/api/proyectos/{self.proyecto_id}/detail", headers={"Authorization": f"Bearer {token}"})
        data = r.json()
        por_estado = data["estadisticas"]["por_estado"]
        estados = {e["estado"]: e["count"] for e in por_estado}
        assert estados.get("ING") == 1
        assert estados.get("APB") == 1
        assert estados.get("OBS") == 1

    def test_eventos_por_proyecto_requiere_admin(self):
        # Crear usuario no-admin
        client.post("/api/auth/register", json={"username": "user2", "email": "u2@test.com", "password": "user2123"})
        token = self._login("user2", "user2123")
        r = client.get(f"/api/eventos/por-proyecto/{self.proyecto_id}", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 403

    def test_eventos_por_proyecto_admin(self):
        token = self._login("admin", "admin123")
        r = client.get(f"/api/eventos/por-proyecto/{self.proyecto_id}", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert isinstance(r.json(), list)
