#!/usr/bin/env bash
set -Eeuo pipefail

: "${DATABASE_URL:?DATABASE_URL est obligatoire}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
mkdir -p "$BACKUP_DIR"

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
output="$BACKUP_DIR/mon-orientation-$stamp.dump"
pg_dump "$DATABASE_URL" --format=custom --no-owner --file="$output"
sha256sum "$output" > "$output.sha256"
find "$BACKUP_DIR" -type f -name 'mon-orientation-*.dump' -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -type f -name 'mon-orientation-*.dump.sha256' -mtime "+$RETENTION_DAYS" -delete
printf 'Sauvegarde créée : %s\n' "$output"
