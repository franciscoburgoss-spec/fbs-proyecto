from fastapi import APIRouter, Depends, Query
from typing import Optional, Literal

from backend.database import get_conn
from backend.routers.auth import require_auth

router = APIRouter()


@router.get("/proyectos")
def reporte_proyectos(user: dict = Depends(require_auth)):
    """Estadisticas agregadas de proyectos: total y por etapa."""
    with get_conn() as conn:
        total = conn.execute("SELECT COUNT(*) FROM proyectos").fetchone()[0]
        por_etapa = conn.execute(
            "SELECT etapa_actual, COUNT(*) as count FROM proyectos GROUP BY etapa_actual ORDER BY count DESC"
        ).fetchall()
        por_cliente = conn.execute(
            "SELECT cliente, COUNT(*) as count FROM proyectos WHERE cliente IS NOT NULL GROUP BY cliente ORDER BY count DESC LIMIT 10"
        ).fetchall()
        recientes = conn.execute(
            "SELECT id, nombre, acronimo, etapa_actual, fecha_creacion FROM proyectos ORDER BY fecha_creacion DESC LIMIT 5"
        ).fetchall()

    return {
        "total": total,
        "por_etapa": [dict(r) for r in por_etapa],
        "por_cliente": [dict(r) for r in por_cliente],
        "recientes": [dict(r) for r in recientes],
    }


@router.get("/documentos")
def reporte_documentos(
    user: dict = Depends(require_auth),
    proyecto_id: Optional[int] = Query(None),
):
    """Estadisticas agregadas de documentos: total, por estado, por modulo, por etapa."""
    where = ""
    params = []
    if proyecto_id:
        where = " WHERE proyecto_id = ?"
        params = [proyecto_id]

    with get_conn() as conn:
        total = conn.execute(
            f"SELECT COUNT(*) FROM documentos{where}", params
        ).fetchone()[0]

        por_estado = conn.execute(
            f"SELECT estado, COUNT(*) as count FROM documentos{where} GROUP BY estado ORDER BY count DESC",
            params,
        ).fetchall()

        por_modulo = conn.execute(
            f"SELECT modulo, COUNT(*) as count FROM documentos{where} GROUP BY modulo ORDER BY count DESC",
            params,
        ).fetchall()

        por_etapa = conn.execute(
            f"SELECT etapa, COUNT(*) as count FROM documentos{where} GROUP BY etapa ORDER BY count DESC",
            params,
        ).fetchall()

        # Documentos con observaciones pendientes (estado OBS)
        observaciones = conn.execute(
            f"SELECT d.id, d.nombre, d.modulo, d.etapa, d.observacion, p.acronimo FROM documentos d JOIN proyectos p ON d.proyecto_id = p.id WHERE d.estado = 'OBS'{(' AND d.proyecto_id = ?' if proyecto_id else '')} ORDER BY d.fecha_creacion DESC LIMIT 10",
            ([proyecto_id] if proyecto_id else []),
        ).fetchall()

        por_modulo_estado = conn.execute(
            f"SELECT modulo, estado, COUNT(*) as count FROM documentos{where} GROUP BY modulo, estado",
            params,
        ).fetchall()

    return {
        "total": total,
        "por_estado": [dict(r) for r in por_estado],
        "por_modulo": [dict(r) for r in por_modulo],
        "por_modulo_estado": [dict(r) for r in por_modulo_estado],
        "por_etapa": [dict(r) for r in por_etapa],
        "observaciones_pendientes": [dict(r) for r in observaciones],
    }


@router.get("/general")
def reporte_general(user: dict = Depends(require_auth)):
    """Dashboard general: KPIs combinados de proyectos, documentos y usuarios."""
    with get_conn() as conn:
        total_proyectos = conn.execute("SELECT COUNT(*) FROM proyectos").fetchone()[0]
        total_documentos = conn.execute("SELECT COUNT(*) FROM documentos").fetchone()[0]
        total_usuarios = conn.execute("SELECT COUNT(*) FROM usuarios").fetchone()[0]
        total_eventos = conn.execute("SELECT COUNT(*) FROM eventos").fetchone()[0]

        # Documentos por estado para el grafico principal
        doc_por_estado = conn.execute(
            "SELECT estado, COUNT(*) as count FROM documentos GROUP BY estado ORDER BY count DESC"
        ).fetchall()

        # Proyectos por etapa
        proj_por_etapa = conn.execute(
            "SELECT etapa_actual, COUNT(*) as count FROM proyectos GROUP BY etapa_actual ORDER BY count DESC"
        ).fetchall()

        # Evolucion de proyectos por mes (ultimos 6 meses)
        evolucion = conn.execute(
            "SELECT strftime('%Y-%m', fecha_creacion) as mes, COUNT(*) as count FROM proyectos GROUP BY mes ORDER BY mes DESC LIMIT 6"
        ).fetchall()

    return {
        "totales": {
            "proyectos": total_proyectos,
            "documentos": total_documentos,
            "usuarios": total_usuarios,
            "eventos": total_eventos,
        },
        "documentos_por_estado": [dict(r) for r in doc_por_estado],
        "proyectos_por_etapa": [dict(r) for r in proj_por_etapa],
        "evolucion_proyectos": [dict(r) for r in evolucion],
    }


@router.get("/export/csv")
def exportar_csv(
    user: dict = Depends(require_auth),
    entidad: Literal["proyectos", "documentos"] = Query(...),
):
    """Exporta proyectos o documentos a CSV. Devuelve texto plano CSV."""
    import csv
    import io

    output = io.StringIO()
    writer = csv.writer(output)

    with get_conn() as conn:
        if entidad == "proyectos":
            writer.writerow(["ID", "Nombre", "Acronimo", "Etapa", "Descripcion", "Cliente", "Ubicacion", "Fecha Creacion"])
            rows = conn.execute("SELECT * FROM proyectos ORDER BY id").fetchall()
            for r in rows:
                writer.writerow([r["id"], r["nombre"], r["acronimo"], r["etapa_actual"], r["descripcion"], r["cliente"], r["ubicacion"], r["fecha_creacion"]])
        else:
            writer.writerow(["ID", "Proyecto ID", "Nombre", "Modulo", "Etapa", "Estado", "Tipo", "TT", "NN", "Observacion", "Fecha Creacion"])
            rows = conn.execute("SELECT * FROM documentos ORDER BY id").fetchall()
            for r in rows:
                writer.writerow([r["id"], r["proyecto_id"], r["nombre"], r["modulo"], r["etapa"], r["estado"], r["tipo"], r["tt"], r["nn"], r["observacion"], r["fecha_creacion"]])

    from fastapi import Response
    filename = f"{entidad}_export.csv"
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
