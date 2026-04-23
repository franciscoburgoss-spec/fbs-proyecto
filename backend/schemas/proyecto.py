from pydantic import BaseModel
from typing import Optional, Literal


class ProyectoOut(BaseModel):
    id: int
    nombre: str
    acronimo: str
    etapa_actual: Literal["CHK", "R1", "R2", "R3", "APB"]
    descripcion: Optional[str] = None
    cliente: Optional[str] = None
    ubicacion: Optional[str] = None
    fecha_creacion: str
    fecha_modificacion: str

    class Config:
        from_attributes = True


class ProyectoIn(BaseModel):
    nombre: str
    acronimo: str
    descripcion: Optional[str] = None
    cliente: Optional[str] = None
    ubicacion: Optional[str] = None


class ProyectoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    cliente: Optional[str] = None
    ubicacion: Optional[str] = None
    # NOTA: etapa_actual y acronimo NO se incluyen (I-7, I-13)
