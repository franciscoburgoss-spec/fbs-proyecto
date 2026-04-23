from functools import lru_cache
from spec_engine.loader import load_spec
from spec_engine.validator import build_validator
from backend.database import get_conn


def _todos_docs_etapa_apb(ctx: dict) -> bool:
    proyecto_id = ctx["proyecto_id"]
    etapa = ctx["etapa_actual"]
    with get_conn() as conn:
        row = conn.execute(
            "SELECT COUNT(*) FROM documentos WHERE proyecto_id = ? AND etapa = ? AND estado != 'APB'",
            (proyecto_id, etapa),
        ).fetchone()
    return row[0] == 0


def _todos_docs_apb(ctx: dict) -> bool:
    proyecto_id = ctx["proyecto_id"]
    with get_conn() as conn:
        row = conn.execute(
            "SELECT COUNT(*) FROM documentos WHERE proyecto_id = ? AND estado != 'APB'",
            (proyecto_id,),
        ).fetchone()
    return row[0] == 0


_GUARDS = {
    "todos_docs_etapa_apb": _todos_docs_etapa_apb,
    "todos_docs_apb": _todos_docs_apb,
}


@lru_cache(maxsize=1)
def get_validator():
    spec = load_spec("specs/proyecto.yaml")
    return build_validator(spec, _GUARDS)
