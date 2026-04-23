from pydantic import BaseModel, EmailStr
from typing import Optional, Literal


class UsuarioOut(BaseModel):
    id: int
    username: str
    email: str
    rol: Literal["admin", "user"]
    activo: bool
    fecha_creacion: str

    class Config:
        from_attributes = True


class RegisterIn(BaseModel):
    username: str
    email: EmailStr
    password: str
    rol: Optional[Literal["admin", "user"]] = "user"


class LoginIn(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    sub: Optional[str] = None
