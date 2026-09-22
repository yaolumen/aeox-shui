#!/usr/bin/env bash
# ========================================
# Quantum Fate Lite · SQLite Backup
# ========================================
# Usage:
#   bash scripts/backup-db.sh
#
# Creates a timestamped backup in ./backups/
# Safe for live DB (uses SQLite backup API via .backup command)
# ========================================

set -e

cd "$(dirname "$0")/.."

BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/qfl_${TIMESTAMP}.db"

DB_PATH="./data/qfl.db"

if [ ! -f "$DB_PATH" ]; then
  echo "ERROR: Database not found at $DB_PATH"
  exit 1
fi

echo "Backing up $DB_PATH → $BACKUP_FILE"

# Use sqlite3 .backup for consistent snapshot of live DB
if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"
else
  # Fallback: copy (may have minor inconsistency on live DB)
  cp "$DB_PATH" "$BACKUP_FILE"
  echo "WARNING: sqlite3 CLI not found, used file copy (may not be consistent)"
fi

# Compress
gzip -f "$BACKUP_FILE"
echo "Compressed: ${BACKUP_FILE}.gz ($(du -h "${BACKUP_FILE}.gz" | cut -f1))"

# Keep only last 30 backups
ls -t "$BACKUP_DIR"/qfl_*.db.gz | tail -n +31 | xargs -r rm --
echo "Cleanup: keeping last 30 backups"

echo "Done."
