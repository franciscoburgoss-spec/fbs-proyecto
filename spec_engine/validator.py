from dataclasses import dataclass
from typing import Callable


@dataclass
class TransitionError(Exception):
    code: str
    http: int
    details: dict


def build_validator(spec: dict, guards: dict[str, Callable] | None = None):
    guards = guards or {}
    states = spec["states"]
    trans_index = {(t["from"], t["to"]): t for t in spec["transitions"]}
    err = spec["errors"]

    def validar(
        origen: str, destino: str, payload: dict | None = None, ctx: dict | None = None
    ) -> dict:
        if destino not in states:
            raise TransitionError(**err["state_unknown"], details={"to": destino})

        t = trans_index.get((origen, destino))
        if not t:
            raise TransitionError(
                **err["invalid_transition"], details={"from": origen, "to": destino}
            )

        for field in t.get("payload", []):
            if not payload or field not in payload:
                raise TransitionError(
                    **err["missing_payload"], details={"missing": field}
                )

        for guard_name in t.get("guards", []):
            if not guards[guard_name](ctx or {}):
                raise TransitionError(
                    **err["guard_failed"], details={"guard": guard_name}
                )

        return t  # el caller usa t["event"] para emitir al JSONL

    return validar
