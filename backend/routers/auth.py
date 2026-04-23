import os
import sqlite3
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from typing import Optional

from backend.database import get_conn
from backend.schemas.auth import (
    UsuarioOut, RegisterIn, LoginIn, Token, TokenPayload,
    PasswordChangeIn, PerfilUpdate,
)

router = APIRouter()

SECRET_KEY = os.environ.get("JWT_SECRET", "fbs-dev-secret-key-cambiar-en-produccion")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 horas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[dict]:
    """Dependencia para proteger endpoints. Devuelve None si no hay token (para rutas publicas opcionales)."""
    if token is None:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None

    with get_conn() as conn:
        row = conn.execute(
            "SELECT id, username, email, rol, activo, fecha_creacion FROM usuarios WHERE id = ?",
            (int(user_id),)
        ).fetchone()
    return dict(row) if row else None


def require_auth(user: Optional[dict] = Depends(get_current_user)) -> dict:
    """Dependencia estricta: lanza 401 si no hay usuario autenticado."""
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_admin(user: dict = Depends(require_auth)) -> dict:
    """Dependencia: requiere rol admin. Lanza 403 si no es admin."""
    if user.get("rol") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requiere rol administrador",
        )
    return user


@router.post("/register", response_model=UsuarioOut, status_code=201)
def register(data: RegisterIn):
    """Registro de nuevo usuario. El primer usuario registrado sera admin si no hay ninguno."""
    hashed = get_password_hash(data.password)

    with get_conn() as conn:
        # Verificar si es el primer usuario
        count = conn.execute("SELECT COUNT(*) FROM usuarios").fetchone()[0]
        rol = "admin" if count == 0 else data.rol

        try:
            cursor = conn.execute(
                """
                INSERT INTO usuarios (username, email, password_hash, rol)
                VALUES (?, ?, ?, ?)
                """,
                (data.username, data.email, hashed, rol),
            )
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=409, detail="username o email ya existe")

        user_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM usuarios WHERE id = ?", (user_id,)).fetchone()

    return dict(row)


@router.post("/login", response_model=Token)
def login(data: LoginIn):
    """Login con JSON. Devuelve JWT."""
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM usuarios WHERE username = ?",
            (data.username,)
        ).fetchone()

    if not row or not verify_password(data.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="credenciales invalidas")

    access_token = create_access_token(data={"sub": str(row["id"])})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UsuarioOut)
def me(user: dict = Depends(require_auth)):
    """Devuelve info del usuario autenticado."""
    return user


# --- Administracion de usuarios (solo admin) ---

@router.get("/users", response_model=list[UsuarioOut])
def listar_usuarios(user: dict = Depends(require_admin)):
    """Lista todos los usuarios. Solo admin."""
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, username, email, rol, activo, fecha_creacion FROM usuarios ORDER BY id"
        ).fetchall()
    return [dict(r) for r in rows]


@router.patch("/users/{id}/rol", response_model=UsuarioOut)
def cambiar_rol(id: int, body: dict, user: dict = Depends(require_admin)):
    """Cambia el rol de un usuario. Body: {'rol': 'admin'|'user'}."""
    nuevo_rol = body.get("rol")
    if nuevo_rol not in ("admin", "user"):
        raise HTTPException(status_code=422, detail="rol debe ser 'admin' o 'user'")

    with get_conn() as conn:
        row = conn.execute("SELECT id FROM usuarios WHERE id = ?", (id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="usuario no encontrado")

        conn.execute("UPDATE usuarios SET rol = ? WHERE id = ?", (nuevo_rol, id))
        row = conn.execute(
            "SELECT id, username, email, rol, activo, fecha_creacion FROM usuarios WHERE id = ?",
            (id,)
        ).fetchone()
    return dict(row)


@router.patch("/users/{id}/activar", response_model=UsuarioOut)
def toggle_activo(id: int, user: dict = Depends(require_admin)):
    """Activa o desactiva un usuario (toggle del campo activo)."""
    with get_conn() as conn:
        row = conn.execute("SELECT id, activo FROM usuarios WHERE id = ?", (id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="usuario no encontrado")

        # No permitir desactivarse a si mismo
        if id == user["id"]:
            raise HTTPException(status_code=400, detail="No puedes desactivarte a ti mismo")

        nuevo_estado = 0 if row["activo"] else 1
        conn.execute("UPDATE usuarios SET activo = ? WHERE id = ?", (nuevo_estado, id))
        row = conn.execute(
            "SELECT id, username, email, rol, activo, fecha_creacion FROM usuarios WHERE id = ?",
            (id,)
        ).fetchone()
    return dict(row)


# --- Perfil propio ---

@router.patch("/me", response_model=UsuarioOut)
def actualizar_perfil(data: PerfilUpdate, user: dict = Depends(require_auth)):
    """Actualiza el email del usuario autenticado."""
    if data.email is None:
        raise HTTPException(status_code=422, detail="no se envio ningun campo editable")

    with get_conn() as conn:
        try:
            conn.execute("UPDATE usuarios SET email = ? WHERE id = ?", (data.email, user["id"]))
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=409, detail="email ya existe")

        row = conn.execute(
            "SELECT id, username, email, rol, activo, fecha_creacion FROM usuarios WHERE id = ?",
            (user["id"],)
        ).fetchone()
    return dict(row)


@router.post("/me/password")
def cambiar_password(data: PasswordChangeIn, user: dict = Depends(require_auth)):
    """Cambia la contraseña del usuario autenticado."""
    with get_conn() as conn:
        row = conn.execute("SELECT password_hash FROM usuarios WHERE id = ?", (user["id"],)).fetchone()

    if not verify_password(data.current_password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="contraseña actual incorrecta")

    nuevo_hash = get_password_hash(data.new_password)
    with get_conn() as conn:
        conn.execute("UPDATE usuarios SET password_hash = ? WHERE id = ?", (nuevo_hash, user["id"]))

    return {"detail": "contraseña actualizada"}
