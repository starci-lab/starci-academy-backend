#!/usr/bin/env bash
# Fix stale lesson-path references after the backend/<lang> migration.
# Inserts `backend/` before a language dir when it's directly under a lesson slug:
#   <lesson>/0-typescript   -> <lesson>/backend/0-typescript   (and 1-java/2-csharp/3-go)
#   cd 0-typescript         -> cd backend/0-typescript          (bare, lesson-root relative)
# SKIPS already-correct `backend/<lang>` (segment exactly "backend"), so it is idempotent
# and safe even for lesson slugs that END in "backend" (e.g. 0-frameworks-in-backend).
# Targets text docs: *.md, *.txt, README*, test.md. Skips .git / node_modules / build dirs.
# Usage: [DRYRUN=1] bash .audits/fix-doc-paths.sh <dir> [<dir> ...]
set -u
DRYRUN="${DRYRUN:-0}"
LANGS_RE='0-typescript|1-java|2-csharp|3-go'

[ "$#" -ge 1 ] || { echo "usage: bash fix-doc-paths.sh <dir> [<dir>...]"; exit 2; }

# Perl program: two substitutions.
#  (1) <segment>/<lang>  -> insert backend/ unless segment is exactly "backend"
#  (2) bare `cd <lang>`  -> cd backend/<lang>
read -r -d '' PERL <<'PL'
s{([A-Za-z0-9._-]+)/(0-typescript|1-java|2-csharp|3-go)\b}{ $1 eq 'backend' ? "$1/$2" : "$1/backend/$2" }ge;
s{\b(cd\s+)(0-typescript|1-java|2-csharp|3-go)\b}{$1backend/$2}g;
PL

total=0
for base in "$@"; do
  [ -d "$base" ] || { echo "skip (not dir): $base"; continue; }
  while IFS= read -r -d '' f; do
    before="$(cat "$f")"
    after="$(printf '%s' "$before" | perl -0pe "$PERL")"
    if [ "$before" != "$after" ]; then
      n=$(diff <(printf '%s' "$before") <(printf '%s' "$after") | grep -c '^>')
      total=$((total+1))
      if [ "$DRYRUN" = "1" ]; then
        echo "DRY would fix ($n lines): $f"
      else
        printf '%s' "$after" > "$f"
        echo "fixed ($n lines): $f"
      fi
    fi
  done < <(find "$base" \
        \( -name .git -o -name node_modules -o -name dist -o -name build -o -name target -o -name bin -o -name obj \) -prune -o \
        -type f \( -name '*.md' -o -name '*.txt' -o -name 'README*' -o -name 'test.md' \) -print0)
done
echo "---- files changed: $total (DRYRUN=$DRYRUN) ----"
