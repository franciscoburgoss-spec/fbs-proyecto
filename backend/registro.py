import json
import os
from datetime import datetime

from backend.database import get_conn

HISTORIAL_PATH = os.environ.get("FBS_HISTORIAL_PATH", "./registro/historial.jsonl")


def emit_evento(event: str, **kwargs):
    """Emite un evento: guarda en archivo JSONL y en SQLite."""
    os.makedirs(os.path.dirname(HISTORIAL_PATH), exist_ok=True)

    # Extraer usuario si esta disponible
    usuario_id = kwargs.pop("usuario_id", None)
    username = kwargs.pop("username", None)
    proyecto_id = kwargs.pop("proyecto_id", None)

    entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "event": event,
        "usuario_id": usuario_id,
        "username": username,
        **kwargs,
    }

    # Guardar en archivo JSONL (historico)
    with open(HISTORIAL_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    # Guardar en SQLite para consulta eficiente
    detalle_json = json.dumps(kwargs, ensure_ascii=False) if kwargs else None
    try:
        with get_conn() as conn:
            conn.execute(
                "INSERT INTO eventos (event, usuario_id, username, detalle, proyecto_id) VALUES (?, ?, ?, ?, ?)",
                (event, usuario_id, username, detalle_json, proyecto_id),
            )
    except Exception:
        # Si falla la base de datos, no bloquear la operacion principal
        pass
