from pydantic import BaseModel
from typing import Optional, Literal


class DocumentoOut(BaseModel):
    id: int
    proyecto_id: int
    nombre: str
    modulo: Literal["EST", "HAB", "MDS"]
    etapa: Literal["CHK", "R1", "R2", "R3"]
    estado: Literal["ING", "OBS", "COR", "APB"]
    tipo: str
    tt: str
    nn: str
    observacion: Optional[str] = None
    fecha_creacion: str
    fecha_modificacion: str

    class Config:
        from_attributes = True


class DocumentoIn(BaseModel):
    nombre: str
    modulo: Literal["EST", "HAB", "MDS"]
    tipo: str
    tt: str
    nn: str


class TransicionIn(BaseModel):
    a: Literal["ING", "OBS", "COR", "APB"]
    payload: Optional[dict] = None
