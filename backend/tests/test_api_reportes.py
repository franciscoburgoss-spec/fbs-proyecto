import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


class TestReportes:
    @pytest.fixture(autouse=True)
    def setup(self):
        """Limpiar datos antes de cada test."""
        from backend.database import get_conn
        with get_conn() as conn:
            conn.execute("DELETE FROM eventos")
            conn.execute("DELETE FROM documentos")
            conn.execute("DELETE FROM proyectos")
            conn.execute("DELETE FROM usuarios WHERE username != 'admin'")
            # Insertar datos de prueba
            conn.executemany(
                "INSERT INTO proyectos (nombre, acronimo, etapa_actual, descripcion, cliente) VALUES (?, ?, ?, ?, ?)",
                [
                    ("Proyecto A", "A-01", "CHK", "Desc A", "Cliente 1"),
                    ("Proyecto B", "B-02", "R1", "Desc B", "Cliente 1"),
                    ("Proyecto C", "C-03", "R2", "Desc C", "Cliente 2"),
                ],
            )
            # Obtener los IDs generados para usar como foreign keys
            rows = conn.execute("SELECT id FROM proyectos ORDER BY id").fetchall()
            pid1 = rows[0]["id"]
            pid2 = rows[1]["id"]
            conn.executemany(
                "INSERT INTO documentos (proyecto_id, nombre, modulo, etapa, estado, tipo, tt, nn) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    (pid1, "Doc 1", "EST", "CHK", "ING", "PDF", "01", "01"),
                    (pid1, "Doc 2", "EST", "CHK", "APB", "PDF", "01", "02"),
                    (pid1, "Doc 3", "HAB", "CHK", "OBS", "PDF", "02", "01"),
                    (pid2, "Doc 4", "MDS", "R1", "COR", "PDF", "03", "01"),
                ],
            )
            # Guardar ids para usar en tests
            self.proyecto_id_1 = pid1
            self.proyecto_id_2 = pid2

    def _login(self, username, password):
        r = client.post("/api/auth/login", json={"username": username, "password": password})
        assert r.status_code == 200
        return r.json()["access_token"]

    # --- reporte general ---

    def test_reporte_general_requiere_auth(self):
        r = client.get("/api/reportes/general")
        assert r.status_code == 401

    def test_reporte_general_funciona(self):
        token = self._login("admin", "admin123")
        r = client.get("/api/reportes/general", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        data = r.json()
        assert "totales" in data
        assert data["totales"]["proyectos"] == 3
        assert data["totales"]["documentos"] == 4
        assert "documentos_por_estado" in data
        assert "proyectos_por_etapa" in data
        assert "evolucion_proyectos" in data

    # --- reporte proyectos ---

    def test_reporte_proyectos(self):
        token = self._login("admin", "admin123")
        r = client.get("/api/reportes/proyectos", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        data = r.json()
        assert data["total"] == 3
        assert len(data["por_etapa"]) >= 1
        assert len(data["por_cliente"]) >= 1
        assert len(data["recientes"]) <= 5

    # --- reporte documentos ---

    def test_reporte_documentos(self):
        token = self._login("admin", "admin123")
        r = client.get("/api/reportes/documentos", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        data = r.json()
        assert data["total"] == 4
        assert len(data["por_estado"]) >= 1
        assert len(data["por_modulo"]) >= 1
        assert len(data["por_etapa"]) >= 1

    def test_reporte_documentos_filtrado_por_proyecto(self):
        token = self._login("admin", "admin123")
        r = client.get(f"/api/reportes/documentos?proyecto_id={self.proyecto_id_1}", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        data = r.json()
        assert data["total"] == 3  # Solo documentos del proyecto 1

    # --- exportar CSV ---

    def test_exportar_proyectos_csv(self):
        token = self._login("admin", "admin123")
        r = client.get("/api/reportes/export/csv?entidad=proyectos", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("text/csv")
        content = r.content.decode()
        assert "ID,Nombre,Acronimo" in content
        assert "Proyecto A" in content

    def test_exportar_documentos_csv(self):
        token = self._login("admin", "admin123")
        r = client.get("/api/reportes/export/csv?entidad=documentos", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("text/csv")
        content = r.content.decode()
        assert "ID,Proyecto ID,Nombre" in content
        assert "Doc 1" in content

    def test_exportar_csv_sin_auth(self):
        r = client.get("/api/reportes/export/csv?entidad=proyectos")
        assert r.status_code == 401

    def test_exportar_csv_entidad_invalida(self):
        token = self._login("admin", "admin123")
        r = client.get("/api/reportes/export/csv?entidad=invalido", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 422
