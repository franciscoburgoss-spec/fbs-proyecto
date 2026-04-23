import sqlite3
import os
from contextlib import contextmanager
from pathlib import Path

DB_PATH = os.environ.get("FBS_DB_PATH", "./fbs.db")


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    with get_conn() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS proyectos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                acronimo TEXT NOT NULL UNIQUE,
                etapa_actual TEXT NOT NULL DEFAULT 'CHK',
                descripcion TEXT,
                cliente TEXT,
                ubicacion TEXT,
                fecha_creacion TEXT DEFAULT (datetime('now')),
                fecha_modificacion TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS documentos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                proyecto_id INTEGER NOT NULL REFERENCES proyectos(id),
                nombre TEXT NOT NULL,
                modulo TEXT NOT NULL CHECK(modulo IN ('EST','HAB','MDS')),
                etapa TEXT NOT NULL CHECK(etapa IN ('CHK','R1','R2','R3')),
                estado TEXT NOT NULL DEFAULT 'ING' CHECK(estado IN ('ING','OBS','COR','APB')),
                tipo TEXT NOT NULL,
                tt TEXT NOT NULL,
                nn TEXT NOT NULL,
                observacion TEXT,
                fecha_creacion TEXT DEFAULT (datetime('now')),
                fecha_modificacion TEXT DEFAULT (datetime('now'))
            );

            CREATE INDEX IF NOT EXISTS idx_docs_proyecto ON documentos(proyecto_id);
            CREATE INDEX IF NOT EXISTS idx_docs_estado ON documentos(estado);
            CREATE INDEX IF NOT EXISTS idx_docs_etapa ON documentos(etapa);
            """
        )


def seed_data():
    """Inserta datos de demo para testing."""
    with get_conn() as conn:
        # Solo si esta vacio
        count = conn.execute("SELECT COUNT(*) FROM proyectos").fetchone()[0]
        if count > 0:
            return

        conn.executemany(
            """
            INSERT INTO proyectos (nombre, acronimo, etapa_actual, descripcion, cliente, ubicacion)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            [
                ("Proyecto Norte", "NORTE-01", "R2", "Ampliacion infraestructura", "Cliente A", "Zona Norte"),
                ("Proyecto Sur", "SUR-02", "R1", "Renovacion sistemas", "Cliente B", "Zona Sur"),
                ("Proyecto Central", "CENT-03", "CHK", "Centro distribucion", "Cliente C", "Zona Central"),
            ],
        )

        conn.executemany(
            """
            INSERT INTO documentos (proyecto_id, nombre, modulo, etapa, estado, tipo, tt, nn, observacion)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (1, "Plan de Manejo Ambiental", "EST", "CHK", "APB", "PDF", "01", "01", None),
                (1, "Estudio de Impacto", "EST", "CHK", "APB", "PDF", "01", "02", None),
                (1, "Habilitacion Urbana", "HAB", "CHK", "APB", "PDF", "02", "01", None),
                (1, "Memoria Descriptiva", "MDS", "CHK", "APB", "PDF", "03", "01", None),
                (1, "Planos Estructurales", "EST", "R1", "APB", "DWG", "01", "03", None),
                (1, "Cimentacion", "EST", "R1", "COR", "DWG", "01", "04", None),
                (1, "Habilitacion R1", "HAB", "R1", "OBS", "PDF", "02", "02", "Faltan firmas del municipio"),
                (1, "Analisis de Suelos", "MDS", "R1", "APB", "PDF", "03", "02", None),
                (1, "Estructura de Techos", "EST", "R2", "ING", "DWG", "01", "05", None),
                (1, "Instalaciones Electricas", "EST", "R2", "ING", "DWG", "01", "06", None),
                (1, "Habilitacion R2", "HAB", "R2", "ING", "PDF", "02", "03", None),
                (1, "Memoria de Calculo", "MDS", "R2", "ING", "PDF", "03", "03", None),
                (2, "Estudio Preliminar Sur", "EST", "CHK", "APB", "PDF", "01", "01", None),
                (2, "Habilitacion Sur", "HAB", "CHK", "APB", "PDF", "02", "01", None),
                (2, "Memoria Sur", "MDS", "CHK", "COR", "PDF", "03", "01", None),
                (3, "Estudio Central", "EST", "CHK", "ING", "PDF", "01", "01", None),
                (3, "Habilitacion Central", "HAB", "CHK", "ING", "PDF", "02", "01", None),
            ],
        )
