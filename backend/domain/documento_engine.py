from functools import lru_cache
from spec_engine.loader import load_spec
from spec_engine.validator import build_validator

_GUARDS = {}


@lru_cache(maxsize=1)
def get_validator():
    spec = load_spec("specs/documento.yaml")
    return build_validator(spec, _GUARDS)
