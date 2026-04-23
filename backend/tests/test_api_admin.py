import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


class TestAdmin:
    @pytest.fixture(autouse=True)
    def setup(self):
        """Limpiar usuarios no-admin antes de cada test."""
        from backend.database import get_conn
        with get_conn() as conn:
            conn.execute("DELETE FROM usuarios WHERE username != 'admin'")

    def _login(self, username, password):
        r = client.post("/api/auth/login", json={"username": username, "password": password})
        assert r.status_code == 200
        return r.json()["access_token"]

    # --- listar usuarios ---

    def test_listar_usuarios_como_admin(self):
        token = self._login("admin", "admin123")
        r = client.get("/api/auth/users", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 1  # al menos el admin

    def test_listar_usuarios_como_user_devuelve_403(self):
        # Crear un usuario normal
        client.post("/api/auth/register", json={
            "username": "normaluser",
            "email": "normal@example.com",
            "password": "pass123"
        })
        token = self._login("normaluser", "pass123")
        r = client.get("/api/auth/users", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 403

    def test_listar_usuarios_sin_token_devuelve_401(self):
        r = client.get("/api/auth/users")
        assert r.status_code == 401

    # --- cambiar rol ---

    def test_admin_cambia_rol_de_usuario(self):
        client.post("/api/auth/register", json={
            "username": "targetuser",
            "email": "target@example.com",
            "password": "pass123"
        })
        admin_token = self._login("admin", "admin123")
        # Obtener ID del usuario creado
        users = client.get("/api/auth/users", headers={"Authorization": f"Bearer {admin_token}"}).json()
        target = [u for u in users if u["username"] == "targetuser"][0]

        r = client.patch(
            f"/api/auth/users/{target['id']}/rol",
            json={"rol": "admin"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 200
        assert r.json()["rol"] == "admin"

    def test_usuario_normal_no_puede_cambiar_rol(self):
        client.post("/api/auth/register", json={
            "username": "user1",
            "email": "u1@example.com",
            "password": "pass123"
        })
        client.post("/api/auth/register", json={
            "username": "user2",
            "email": "u2@example.com",
            "password": "pass123"
        })
        token1 = self._login("user1", "pass123")
        # Necesitamos el ID de user2 - consultar via admin
        admin_token = self._login("admin", "admin123")
        users = client.get("/api/auth/users", headers={"Authorization": f"Bearer {admin_token}"}).json()
        target = [u for u in users if u["username"] == "user2"][0]

        r = client.patch(
            f"/api/auth/users/{target['id']}/rol",
            json={"rol": "admin"},
            headers={"Authorization": f"Bearer {token1}"},
        )
        assert r.status_code == 403

    # --- toggle activo ---

    def test_admin_desactiva_usuario(self):
        client.post("/api/auth/register", json={
            "username": "desactuser",
            "email": "desact@example.com",
            "password": "pass123"
        })
        admin_token = self._login("admin", "admin123")
        users = client.get("/api/auth/users", headers={"Authorization": f"Bearer {admin_token}"}).json()
        target = [u for u in users if u["username"] == "desactuser"][0]
        assert target["activo"] == True

        r = client.patch(
            f"/api/auth/users/{target['id']}/activar",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 200
        assert r.json()["activo"] == False

    def test_admin_no_puede_desactivarse_a_si_mismo(self):
        admin_token = self._login("admin", "admin123")
        users = client.get("/api/auth/users", headers={"Authorization": f"Bearer {admin_token}"}).json()
        admin_user = [u for u in users if u["username"] == "admin"][0]

        r = client.patch(
            f"/api/auth/users/{admin_user['id']}/activar",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 400

    # --- perfil ---

    def test_actualizar_perfil_email(self):
        client.post("/api/auth/register", json={
            "username": "perfiluser",
            "email": "old@example.com",
            "password": "pass123"
        })
        token = self._login("perfiluser", "pass123")
        r = client.patch(
            "/api/auth/me",
            json={"email": "new@example.com"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert r.status_code == 200
        assert r.json()["email"] == "new@example.com"

    def test_cambiar_password_correcto(self):
        client.post("/api/auth/register", json={
            "username": "pwduser",
            "email": "pwd@example.com",
            "password": "oldpass123"
        })
        token = self._login("pwduser", "oldpass123")
        r = client.post(
            "/api/auth/me/password",
            json={"current_password": "oldpass123", "new_password": "newpass456"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert r.status_code == 200
        # Verificar que el nuevo password funciona
        login_r = client.post("/api/auth/login", json={"username": "pwduser", "password": "newpass456"})
        assert login_r.status_code == 200
        assert "access_token" in login_r.json()

    def test_cambiar_password_con_actual_incorrecta(self):
        client.post("/api/auth/register", json={
            "username": "pwduser2",
            "email": "pwd2@example.com",
            "password": "correctpass"
        })
        token = self._login("pwduser2", "correctpass")
        r = client.post(
            "/api/auth/me/password",
            json={"current_password": "wrongpass", "new_password": "newpass456"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert r.status_code == 401

    # --- proteccion por rol en proyectos ---

    def test_crear_proyecto_requiere_admin(self):
        client.post("/api/auth/register", json={
            "username": "normaluser3",
            "email": "n3@example.com",
            "password": "pass123"
        })
        user_token = self._login("normaluser3", "pass123")
        r = client.post(
            "/api/proyectos",
            json={"nombre": "X", "acronimo": "TEST-99"},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert r.status_code == 403

    def test_crear_proyecto_como_admin_funciona(self):
        admin_token = self._login("admin", "admin123")
        r = client.post(
            "/api/proyectos",
            json={"nombre": "X", "acronimo": "TEST-99"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert r.status_code == 201

    def test_listar_proyectos_cualquier_usuario_autenticado(self):
        client.post("/api/auth/register", json={
            "username": "viewer",
            "email": "viewer@example.com",
            "password": "pass123"
        })
        token = self._login("viewer", "pass123")
        r = client.get("/api/proyectos", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200

    def test_eliminar_proyecto_requiere_admin(self):
        # Crear usuario normal y un proyecto como admin
        client.post("/api/auth/register", json={
            "username": "normaluser4",
            "email": "n4@example.com",
            "password": "pass123"
        })
        admin_token = self._login("admin", "admin123")
        r = client.post(
            "/api/proyectos",
            json={"nombre": "Proyecto Test Delete", "acronimo": "TEST-DEL"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        proyecto_id = r.json()["id"]
        # Intentar eliminar como usuario normal
        user_token = self._login("normaluser4", "pass123")
        r = client.delete(f"/api/proyectos/{proyecto_id}", headers={"Authorization": f"Bearer {user_token}"})
        assert r.status_code == 403
