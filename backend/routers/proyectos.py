import sqlite3
from fastapi import APIRouter, HTTPException, Depends
from typing import List

from backend.database import get_conn
from backend.schemas.proyecto import ProyectoOut, ProyectoIn, ProyectoUpdate
from backend.domain.proyecto_engine import get_validator
from backend.registro import emit_evento
from backend.routers.auth import require_auth, require_admin
from spec_engine.validator import TransitionError

router = APIRouter()


@router.get("", response_model=List[ProyectoOut])
def listar_proyectos(user: dict = Depends(require_auth)):
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM proyectos ORDER BY fecha_creacion DESC"
        ).fetchall()
    return [dict(r) for r in rows]


@router.get("/{id}", response_model=ProyectoOut)
def obtener_proyecto(id: int, user: dict = Depends(require_auth)):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM proyectos WHERE id = ?", (id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="proyecto no encontrado")
    return dict(row)


@router.get("/{id}/detail")
def obtener_proyecto_detalle(id: int, user: dict = Depends(require_auth)):
    """Devuelve proyecto completo con sus documentos, estadisticas y eventos recientes."""
    with get_conn() as conn:
        # Proyecto
        row = conn.execute("SELECT * FROM proyectos WHERE id = ?", (id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="proyecto no encontrado")
        proyecto = dict(row)

        # Documentos del proyecto
        documentos = conn.execute(
            "SELECT * FROM documentos WHERE proyecto_id = ? ORDER BY modulo, etapa, nombre",
            (id,),
        ).fetchall()

        # Estadisticas de documentos
        stats_docs = conn.execute(
            "SELECT estado, COUNT(*) as count FROM documentos WHERE proyecto_id = ? GROUP BY estado ORDER BY count DESC",
            (id,),
        ).fetchall()

        # Por modulo
        por_modulo = conn.execute(
            "SELECT modulo, COUNT(*) as count FROM documentos WHERE proyecto_id = ? GROUP BY modulo ORDER BY count DESC",
            (id,),
        ).fetchall()

        # Por etapa
        por_etapa = conn.execute(
            "SELECT etapa, COUNT(*) as count FROM documentos WHERE proyecto_id = ? GROUP BY etapa ORDER BY count DESC",
            (id,),
        ).fetchall()

        # Observaciones pendientes
        observaciones = conn.execute(
            "SELECT id, nombre, modulo, etapa, observacion FROM documentos WHERE proyecto_id = ? AND estado = 'OBS' ORDER BY fecha_creacion DESC",
            (id,),
        ).fetchall()

        # Eventos recientes del proyecto (ultimos 20)
        eventos = conn.execute(
            "SELECT * FROM eventos WHERE proyecto_id = ? ORDER BY fecha_creacion DESC LIMIT 20",
            (id,),
        ).fetchall()

    return {
        "proyecto": proyecto,
        "documentos": [dict(d) for d in documentos],
        "estadisticas": {
            "total_documentos": len(documentos),
            "por_estado": [dict(s) for s in stats_docs],
            "por_modulo": [dict(m) for m in por_modulo],
            "por_etapa": [dict(e) for e in por_etapa],
            "observaciones_pendientes": [dict(o) for o in observaciones],
        },
        "eventos_recientes": [dict(e) for e in eventos],
    }


@router.post("", response_model=ProyectoOut, status_code=201)
def crear_proyecto(data: ProyectoIn, user: dict = Depends(require_admin)):
    with get_conn() as conn:
        try:
            cursor = conn.execute(
                """
                INSERT INTO proyectos (nombre, acronimo, descripcion, cliente, ubicacion)
                VALUES (?, ?, ?, ?, ?)
                """,
                (data.nombre, data.acronimo, data.descripcion, data.cliente, data.ubicacion),
            )
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=409, detail="acronimo duplicado")
        proyecto_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM proyectos WHERE id = ?", (proyecto_id,)).fetchone()

    emit_evento("proyecto_creado", proyecto_id=proyecto_id, acronimo=data.acronimo)
    return dict(row)


@router.patch("/{id}", response_model=ProyectoOut)
def actualizar_proyecto(id: int, data: ProyectoUpdate, user: dict = Depends(require_auth)):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM proyectos WHERE id = ?", (id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="proyecto no encontrado")

        # Solo actualizar campos enviados (no nulos)
        campos = []
        valores = []
        for campo in ["nombre", "descripcion", "cliente", "ubicacion"]:
            val = getattr(data, campo)
            if val is not None:
                campos.append(f"{campo} = ?")
                valores.append(val)

        if campos:
            valores.append(id)
            conn.execute(
                f"UPDATE proyectos SET {', '.join(campos)}, fecha_modificacion = datetime('now') WHERE id = ?",
                valores,
            )
            row = conn.execute("SELECT * FROM proyectos WHERE id = ?", (id,)).fetchone()

    emit_evento("proyecto_actualizado", proyecto_id=id, campos=campos)
    return dict(row)


@router.delete("/{id}", status_code=204)
def eliminar_proyecto(id: int, user: dict = Depends(require_admin)):
    with get_conn() as conn:
        row = conn.execute("SELECT id FROM proyectos WHERE id = ?", (id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="proyecto no encontrado")

        # ON DELETE CASCADE no esta habilitado en SQLite por default sin FK enforcement
        # Pero ejecutamos PRAGMA foreign_keys=ON en get_conn, asi que si hay docs fallara
        try:
            conn.execute("DELETE FROM proyectos WHERE id = ?", (id,))
        except Exception:
            raise HTTPException(status_code=409, detail="no se puede eliminar: tiene documentos asociados")

    emit_evento("proyecto_eliminado", proyecto_id=id)
    return None


@router.post("/{id}/transicion", response_model=ProyectoOut)
def transicionar_proyecto(id: int, body: dict, user: dict = Depends(require_auth)):
    """Body esperado: {'a': 'R1'} — la etapa destino."""
    destino = body.get("a")
    if not destino:
        raise HTTPException(status_code=422, detail="falta campo 'a' con estado destino")

    with get_conn() as conn:
        row = conn.execute("SELECT * FROM proyectos WHERE id = ?", (id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="proyecto no encontrado")

        origen = row["etapa_actual"]

        # Validar transicion via spec_engine
        validar = get_validator()
        try:
            t = validar(origen, destino, ctx={"proyecto_id": id, "etapa_actual": origen})
        except TransitionError as e:
            raise HTTPException(status_code=e.http, detail={"code": e.code, "details": e.details})

        # Actualizar estado
        conn.execute(
            "UPDATE proyectos SET etapa_actual = ?, fecha_modificacion = datetime('now') WHERE id = ?",
            (destino, id),
        )
        row = conn.execute("SELECT * FROM proyectos WHERE id = ?", (id,)).fetchone()

    emit_evento(
        t["event"],
        entity="proyecto",
        proyecto_id=id,
        from_state=origen,
        to_state=destino,
    )
    return dict(row)
