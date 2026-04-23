import json
import os
from datetime import datetime

HISTORIAL_PATH = os.environ.get("FBS_HISTORIAL_PATH", "./registro/historial.jsonl")


def emit_evento(event: str, **kwargs):
    os.makedirs(os.path.dirname(HISTORIAL_PATH), exist_ok=True)
    entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "event": event,
        **kwargs,
    }
    with open(HISTORIAL_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
