import sys
from pathlib import Path
from spec_engine.loader import load_spec
from spec_engine.linter import lint


def main(argv):
    folder = Path(argv[1])
    failed = False
    for yaml_file in folder.glob("*.yaml"):
        errors = lint(load_spec(yaml_file))
        if errors:
            failed = True
            print(f"[FAIL] {yaml_file}:")
            for e in errors:
                print(f"   - {e}")
        else:
            print(f"[OK]   {yaml_file}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main(sys.argv)
