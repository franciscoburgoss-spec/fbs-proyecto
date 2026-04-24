#!/usr/bin/env bash
set -e

# FBS Start Script para macOS (MacBook Air 7,2 compatible)
# No requiere Docker. Consume ~150MB RAM total.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Activar entorno virtual si existe
VENV_DIR="$PROJECT_DIR/.venv"
if [ -d "$VENV_DIR" ] && [ -f "$VENV_DIR/bin/activate" ]; then
    source "$VENV_DIR/bin/activate"
    echo "Entorno virtual activado: $VENV_DIR"
else
    echo "WARNING: No se encontro entorno virtual en $VENV_DIR"
    echo "Crealo antes de ejecutar este script:"
    echo "  python3 -m venv .venv"
    echo "  source .venv/bin/activate"
    echo "  pip install -r requirements.txt"
    echo ""
fi

# Cargar .env si existe
ENV_FILE="$PROJECT_DIR/.env"
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
    echo "Configuracion cargada desde .env"
else
    echo "WARNING: No se encontro .env"
fi

# Configuracion por defecto (sobrescribible via env)
export FBS_DB_PATH="${FBS_DB_PATH:-$HOME/.fbs/fbs.db}"
export FBS_HISTORIAL_PATH="${FBS_HISTORIAL_PATH:-$HOME/.fbs/registro/historial.jsonl}"
export JWT_SECRET="${JWT_SECRET:?Error: JWT_SECRET no esta definida. Edita el archivo .env}"
export FBS_CORS_ORIGINS="${FBS_CORS_ORIGINS:-http://localhost:8000,http://127.0.0.1:8000}"
export JWT_EXPIRE_MINUTES="${JWT_EXPIRE_MINUTES:-1440}"
export UVICORN_PORT="${UVICORN_PORT:-8000}"

mkdir -p "$(dirname "$FBS_DB_PATH")"
mkdir -p "$(dirname "$FBS_HISTORIAL_PATH")"

echo "=== FBS Proyecto ==="
echo "BD: $FBS_DB_PATH"
echo "Registro: $FBS_HISTORIAL_PATH"
echo "Puerto: $UVICORN_PORT"
echo ""

# Backup de la BD si existe
if [ -f "$FBS_DB_PATH" ]; then
    BACKUP_DIR="$(dirname "$FBS_DB_PATH")/backups"
    mkdir -p "$BACKUP_DIR"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    cp "$FBS_DB_PATH" "$BACKUP_DIR/fbs_$TIMESTAMP.db"
    echo "Backup creado: backups/fbs_$TIMESTAMP.db"
fi

# Build del frontend (requiere Node.js instalado)
if command -v npm &> /dev/null; then
    echo "Building frontend..."
    cd "$PROJECT_DIR/frontend"
    npm install --silent
    npm run build
    echo "Frontend listo en frontend/dist/"
else
    echo "WARNING: npm no encontrado. El frontend no se construira."
    echo "Instala Node.js o usa el frontend en modo dev con 'npm run dev' en otra terminal."
fi

echo ""
echo "Iniciando servidor en http://localhost:$UVICORN_PORT"
echo "Presiona Ctrl+C para detener."
echo ""

cd "$PROJECT_DIR"
exec python3 -m uvicorn backend.main:app --host 0.0.0.0 --port "$UVICORN_PORT" --workers 1
