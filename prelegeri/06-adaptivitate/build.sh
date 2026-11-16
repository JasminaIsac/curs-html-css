#!/usr/bin/env bash
# Assembles index.html from src/template.html + src/parts/part*.html.
set -euo pipefail
cd "$(dirname "$0")"

parts=$(mktemp)
trap 'rm -f "$parts"' EXIT
for f in src/parts/part*.html; do
    cat "$f" >> "$parts"
    printf '\n' >> "$parts"
done

awk -v parts="$parts" '
    /<!-- PARTS -->/ { while ((getline line < parts) > 0) print line; next }
    { print }
' src/template.html > index.html

echo "index.html built from $(ls src/parts/part*.html | wc -l) parts"
