#!/usr/bin/env bash
# setup-mac.sh — Script de setup unico para macOS
# Ejecutar desde la carpeta del proyecto: ./scripts/setup-mac.sh

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "=== FBS Proyecto — Setup para MacBook Air ==="
echo "Ubicacion: $PROJECT_DIR"
echo ""

# 1. Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: python3 no encontrado. Instala Python 3.11+ desde python.org"
    exit 1
fi

PYTHON_VER=$(python3 --version 2>&1 | awk '{print $2}')
echo "✓ Python detectado: $PYTHON_VER"

# 2. Verificar Node.js (solo para build del frontend)
if command -v node &> /dev/null; then
    NODE_VER=$(node --version)
    echo "✓ Node.js detectado: $NODE_VER"
else
    echo "⚠ Node.js no encontrado. El frontend no se construira."
    echo "  Instala Node.js 18+ si necesitas el frontend estatico."
fi

# 3. Crear/verificar venv
VENV_DIR="$PROJECT_DIR/.venv"
if [ ! -d "$VENV_DIR" ]; then
    echo "→ Creando entorno virtual en .venv..."
    python3 -m venv "$VENV_DIR"
fi

# 4. Activar venv e instalar dependencias
echo "→ Activando venv e instalando dependencias..."
source "$VENV_DIR/bin/activate"
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

# 5. Hacer scripts ejecutables (por si acaso)
chmod +x "$PROJECT_DIR/scripts/start.sh"
chmod +x "$PROJECT_DIR/scripts/backup.sh"

# 6. Verificar/crear .env
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "→ Creando .env desde plantilla..."
    cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
    echo "⚠ IMPORTANTE: Edita .env y define JWT_SECRET con al menos 32 caracteres"
fi

echo ""
echo "=== Setup completo ==="
echo ""
echo "Para iniciar la aplicacion:"
echo "  1. Edita .env y define JWT_SECRET"
echo "  2. export JWT_SECRET=\"tu-clave-de-32-caracteres\""
echo "  3. ./scripts/start.sh"
echo ""
echo "Para desarrollo (frontend hot-reload):"
echo "  Terminal 1: source .venv/bin/activate && uvicorn backend.main:app --reload"
echo "  Terminal 2: cd frontend && npm install && npm run dev"
