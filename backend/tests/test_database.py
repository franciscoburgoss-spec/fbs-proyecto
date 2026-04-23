import pytest


def test_db_has_proyectos(conn):
    row = conn.execute("SELECT COUNT(*) FROM proyectos").fetchone()
    assert row[0] == 3


def test_db_has_documentos(conn):
    row = conn.execute("SELECT COUNT(*) FROM documentos").fetchone()
    assert row[0] == 17


def test_documento_estados_validos(conn):
    rows = conn.execute("SELECT DISTINCT estado FROM documentos").fetchall()
    estados = {r["estado"] for r in rows}
    assert estados.issubset({"ING", "OBS", "COR", "APB"})


def test_proyecto_acronimo_unique(conn):
    with pytest.raises(Exception):
        conn.execute(
            "INSERT INTO proyectos (nombre, acronimo) VALUES (?, ?)",
            ("Duplicado", "NORTE-01"),
        )


def test_documento_fk_proyecto(conn):
    with pytest.raises(Exception):
        conn.execute(
            """
            INSERT INTO documentos (proyecto_id, nombre, modulo, etapa, estado, tipo, tt, nn)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (9999, "Doc invalido", "EST", "CHK", "ING", "PDF", "01", "01"),
        )
