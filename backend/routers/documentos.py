from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Literal

from backend.database import get_conn
from backend.schemas.documento import DocumentoOut, DocumentoIn, TransicionIn
from backend.domain.documento_engine import get_validator
from backend.registro import emit_evento
from spec_engine.validator import TransitionError

router = APIRouter()


@router.get("", response_model=List[DocumentoOut])
def listar_documentos(
    proyecto_id: Optional[int] = Query(None),
    etapa: Optional[Literal["CHK", "R1", "R2", "R3"]] = Query(None),
    estado: Optional[Literal["ING", "OBS", "COR", "APB"]] = Query(None),
    modulo: Optional[Literal["EST", "HAB", "MDS"]] = Query(None),
):
    query = "SELECT * FROM documentos WHERE 1=1"
    params = []
    if proyecto_id is not None:
        query += " AND proyecto_id = ?"
        params.append(proyecto_id)
    if etapa:
        query += " AND etapa = ?"
        params.append(etapa)
    if estado:
        query += " AND estado = ?"
        params.append(estado)
    if modulo:
        query += " AND modulo = ?"
        params.append(modulo)
    query += " ORDER BY fecha_creacion DESC"

    with get_conn() as conn:
        rows = conn.execute(query, params).fetchall()
    return [dict(r) for r in rows]


@router.get("/{id}", response_model=DocumentoOut)
def obtener_documento(id: int):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM documentos WHERE id = ?", (id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="documento no encontrado")
    return dict(row)


@router.post("", response_model=DocumentoOut, status_code=201)
def crear_documento(data: DocumentoIn, proyecto_id: int):
    """Crea un documento asociado a un proyecto. La etapa se hereda del proyecto."""
    with get_conn() as conn:
        # Verificar que el proyecto existe
        proyecto = conn.execute("SELECT etapa_actual FROM proyectos WHERE id = ?", (proyecto_id,)).fetchone()
        if not proyecto:
            raise HTTPException(status_code=404, detail="proyecto no encontrado")

        etapa = proyecto["etapa_actual"]

        cursor = conn.execute(
            """
            INSERT INTO documentos (proyecto_id, nombre, modulo, etapa, estado, tipo, tt, nn)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (proyecto_id, data.nombre, data.modulo, etapa, "ING", data.tipo, data.tt, data.nn),
        )
        doc_id = cursor.lastrowid
        row = conn.execute("SELECT * FROM documentos WHERE id = ?", (doc_id,)).fetchone()

    emit_evento(
        "documento_creado",
        documento_id=doc_id,
        proyecto_id=proyecto_id,
        modulo=data.modulo,
        etapa=etapa,
    )
    return dict(row)


@router.patch("/{id}", response_model=DocumentoOut)
def actualizar_documento(id: int, data: dict):
    """Permite actualizar nombre, tipo, tt, nn. Estado y etapa via transicion."""
    campos_permitidos = {"nombre", "tipo", "tt", "nn"}
    campos = []
    valores = []
    for k, v in data.items():
        if k in campos_permitidos and v is not None:
            campos.append(f"{k} = ?")
            valores.append(v)

    if not campos:
        raise HTTPException(status_code=422, detail="no se envio ningun campo editable")

    with get_conn() as conn:
        row = conn.execute("SELECT * FROM documentos WHERE id = ?", (id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="documento no encontrado")

        valores.append(id)
        conn.execute(
            f"UPDATE documentos SET {', '.join(campos)}, fecha_modificacion = datetime('now') WHERE id = ?",
            valores,
        )
        row = conn.execute("SELECT * FROM documentos WHERE id = ?", (id,)).fetchone()

    emit_evento("documento_actualizado", documento_id=id, campos=list(data.keys()))
    return dict(row)


@router.delete("/{id}", status_code=204)
def eliminar_documento(id: int):
    with get_conn() as conn:
        row = conn.execute("SELECT id FROM documentos WHERE id = ?", (id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="documento no encontrado")
        conn.execute("DELETE FROM documentos WHERE id = ?", (id,))

    emit_evento("documento_eliminado", documento_id=id)
    return None


@router.post("/{id}/transicion", response_model=DocumentoOut)
def transicionar_documento(id: int, body: TransicionIn):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM documentos WHERE id = ?", (id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="documento no encontrado")

        origen = row["estado"]
        destino = body.a

        # Validar via spec_engine
        validar = get_validator()
        try:
            t = validar(origen, destino, payload=body.payload)
        except TransitionError as e:
            raise HTTPException(status_code=e.http, detail={"code": e.code, "details": e.details})

        # Si la transicion lleva a OBS, guardar observacion del payload
        observacion = None
        if destino == "OBS" and body.payload and "observacion" in body.payload:
            observacion = body.payload["observacion"]

        conn.execute(
            """
            UPDATE documentos SET estado = ?, observacion = ?, fecha_modificacion = datetime('now') WHERE id = ?
            """,
            (destino, observacion, id),
        )
        row = conn.execute("SELECT * FROM documentos WHERE id = ?", (id,)).fetchone()

    emit_evento(
        t["event"],
        entity="documento",
        documento_id=id,
        proyecto_id=row["proyecto_id"],
        from_state=origen,
        to_state=destino,
        observacion=observacion,
    )
    return dict(row)
