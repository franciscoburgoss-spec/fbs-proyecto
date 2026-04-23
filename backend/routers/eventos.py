import json
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional

from backend.database import get_conn
from backend.schemas.evento import EventoOut
from backend.routers.auth import require_admin

router = APIRouter()


@router.get("", response_model=List[EventoOut])
def listar_eventos(
    user: dict = Depends(require_admin),
    event: Optional[str] = Query(None, description="Filtrar por tipo de evento (ej: proyecto_creado)"),
    usuario_id: Optional[int] = Query(None, description="Filtrar por ID de usuario"),
    desde: Optional[str] = Query(None, description="Fecha desde (ISO 8601)"),
    hasta: Optional[str] = Query(None, description="Fecha hasta (ISO 8601)"),
    limit: int = Query(100, ge=1, le=500, description="Maximo de resultados"),
    offset: int = Query(0, ge=0, description="Offset para paginacion"),
):
    """Lista eventos de auditoria. Solo admin. Soporta filtros por tipo, usuario y rango de fechas."""
    query = "SELECT * FROM eventos WHERE 1=1"
    params = []

    if event:
        query += " AND event = ?"
        params.append(event)
    if usuario_id:
        query += " AND usuario_id = ?"
        params.append(usuario_id)
    if desde:
        query += " AND timestamp >= ?"
        params.append(desde)
    if hasta:
        query += " AND timestamp <= ?"
        params.append(hasta)

    query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    with get_conn() as conn:
        rows = conn.execute(query, params).fetchall()

    return [dict(r) for r in rows]


@router.get("/stats", response_model=dict)
def estadisticas_eventos(
    user: dict = Depends(require_admin),
    desde: Optional[str] = Query(None),
    hasta: Optional[str] = Query(None),
):
    """Estadisticas agregadas de eventos: total y por tipo. Solo admin."""
    where = []
    params = []

    if desde:
        where.append("timestamp >= ?")
        params.append(desde)
    if hasta:
        where.append("timestamp <= ?")
        params.append(hasta)

    where_clause = " WHERE " + " AND ".join(where) if where else ""

    with get_conn() as conn:
        total = conn.execute(
            f"SELECT COUNT(*) FROM eventos{where_clause}", params
        ).fetchone()[0]

        por_tipo = conn.execute(
            f"SELECT event, COUNT(*) as count FROM eventos{where_clause} GROUP BY event ORDER BY count DESC",
            params,
        ).fetchall()

    return {
        "total": total,
        "por_tipo": [dict(r) for r in por_tipo],
    }
