import pytest
from spec_engine.loader import load_spec
from spec_engine.validator import build_validator, TransitionError
from spec_engine.generators import generate_test_cases

spec = load_spec("specs/proyecto.yaml")

# Guards mockeados para no depender de DB
MOCK_GUARDS = {
    "todos_docs_etapa_apb": lambda ctx: True,
    "todos_docs_apb": lambda ctx: True,
}

validar = build_validator(spec, MOCK_GUARDS)
cases = generate_test_cases(spec)


@pytest.mark.parametrize("case", cases, ids=lambda c: f"{c['from']}_to_{c['to']}")
def test_transicion(case):
    payload = {f: "x" for f in case.get("payload_required", [])} or None

    if case["valid"]:
        t = validar(case["from"], case["to"], payload)
        assert t["event"], "toda transicion valida debe declarar event"
    else:
        with pytest.raises(TransitionError) as exc:
            validar(case["from"], case["to"], payload)
        assert exc.value.code == case["expected_code"]
