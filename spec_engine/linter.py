def lint(spec: dict) -> list[str]:
    errors = []
    states = set(spec["states"])
    initial = [s for s, m in spec["states"].items() if m.get("initial")]
    terminal = {s for s, m in spec["states"].items() if m.get("terminal")}

    if len(initial) != 1:
        errors.append(f"debe haber exactamente 1 estado initial, hay {len(initial)}")

    reachable = set(initial)
    for t in spec["transitions"]:
        if t["from"] not in states:
            errors.append(f"transicion desde estado desconocido: {t['from']}")
        if t["to"] not in states:
            errors.append(f"transicion hacia estado desconocido: {t['to']}")
        reachable.add(t["to"])

    huerfanos = states - reachable
    if huerfanos:
        errors.append(f"estados inalcanzables: {huerfanos}")

    sin_salida = {
        s
        for s in states - terminal
        if not any(t["from"] == s for t in spec["transitions"])
    }
    if sin_salida:
        errors.append(f"estados sin salida y no terminales: {sin_salida}")

    return errors
