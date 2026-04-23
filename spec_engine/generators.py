def generate_test_cases(spec: dict) -> list[dict]:
    states = list(spec["states"].keys())
    trans_index = {(t["from"], t["to"]): t for t in spec["transitions"]}
    invalid_code = spec["errors"]["invalid_transition"]["code"]

    cases = []
    for o in states:
        for d in states:
            t = trans_index.get((o, d))
            if t:
                cases.append({
                    "from": o,
                    "to": d,
                    "valid": True,
                    "payload_required": t.get("payload", []),
                    "guards": t.get("guards", []),
                    "event": t["event"],
                })
            else:
                cases.append({
                    "from": o,
                    "to": d,
                    "valid": False,
                    "expected_code": invalid_code,
                })
    return cases
