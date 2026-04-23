#!/usr/bin/env bash
set -e

DB_PATH="${FBS_DB_PATH:-$HOME/.fbs/fbs.db}"
BACKUP_DIR="$(dirname "$DB_PATH")/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

cp "$DB_PATH" "$BACKUP_DIR/fbs_$TIMESTAMP.db"
ls -t "$BACKUP_DIR"/fbs_*.db | tail -n +11 | xargs rm -f 2>/dev/null || true

echo "Backup creado: $BACKUP_DIR/fbs_$TIMESTAMP.db"
echo "Retencion: ultimos 10 backups"
