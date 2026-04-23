import os
import sqlite3
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from typing import Optional

from backend.database import get_conn
from backend.schemas.auth import UsuarioOut, RegisterIn, LoginIn, Token, TokenPayload

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
