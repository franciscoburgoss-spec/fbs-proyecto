from pydantic import BaseModel
from typing import Optional


class EventoOut(BaseModel):
    id: int
    timestamp: str
    event: str
    usuario_id: Optional[int] = None
    username: Optional[str] = None
    detalle: Optional[str] = None  # JSON serializado

    class Config:
        from_attributes = True
