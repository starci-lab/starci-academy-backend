#!/usr/bin/env bash
# Migrate each lesson's backend servers under a unified <lesson>/backend/<N>-<lang>/ layout.
#  - OLD 4-lang:   0-typescript,1-java,2-csharp,3-go            -> backend/0-typescript, backend/1-java, ...
#  - NEW 1-backend: backend (TS server directly)               -> backend/0-typescript
#  - MIXED:        backend(=TS) + 1-java,2-csharp,3-go         -> backend/0-typescript + backend/1-java, ...
#  - frontend/ and misc files (README/test.md/.docker/...) stay at lesson level.
# DRYRUN=1 prints planned `git mv` without changing anything (default). DRYRUN=0 executes.
# Operates on .repo/fullstack-mastery-module-* (each is its own git repo).
set -u
DRYRUN="${DRYRUN:-1}"
FILTER="${1:-}"   # optional: only repos whose dir name contains this substring (e.g. module-1-nestjs)
ROOT="$(cd "$(dirname "$0")/.." && pwd)/.repo"
LANGS="0-typescript 1-java 2-csharp 3-go"

run() { if [ "$DRYRUN" = "1" ]; then echo "    DRY: $*"; else ( cd "$1" && shift && eval "$@" ); fi; }

for repo in "$ROOT"/fullstack-mastery-module-*; do
  rn="$(basename "$repo")"
  if [ -n "$FILTER" ]; then case "$rn" in *"$FILTER"*) ;; *) continue;; esac; fi
  [ -d "$repo/.git" ] || { echo "### $rn — SKIP (no .git)"; continue; }
  echo "### $rn"
  for lesson in "$repo"/*/; do
    ln="$(basename "$lesson")"
    case "$ln" in .*) continue;; esac
    [ -d "$lesson" ] || continue
    # Detect TS source: explicit 0-typescript, else a bare backend/ dir (single TS server)
    ts_src=""
    if [ -d "$lesson/0-typescript" ]; then ts_src="0-typescript"
    elif [ -d "$lesson/backend" ] && [ ! -d "$lesson/backend/0-typescript" ]; then ts_src="backend"; fi
    other_langs=""
    for l in 1-java 2-csharp 3-go; do [ -d "$lesson/$l" ] && other_langs="$other_langs $l"; done
    # Nothing to do if no backend content, or already migrated (backend/0-typescript exists)
    if [ -z "$ts_src" ] && [ -z "$other_langs" ]; then continue; fi
    if [ -d "$lesson/backend/0-typescript" ]; then echo "   $ln -> already migrated"; continue; fi
    echo "   $ln  (ts_src=${ts_src:-none}; langs=${other_langs:- none})"
    # Use a staging dir to safely turn a bare backend/ into backend/0-typescript
    stage="__backend_new"
    run "$lesson" "mkdir -p '$stage'"
    if [ "$ts_src" = "backend" ]; then
      run "$lesson" "git mv 'backend' '$stage/0-typescript'"
    elif [ "$ts_src" = "0-typescript" ]; then
      run "$lesson" "git mv '0-typescript' '$stage/0-typescript'"
    fi
    for l in $other_langs; do run "$lesson" "git mv '$l' '$stage/$l'"; done
    run "$lesson" "git mv '$stage' 'backend'"
  done
done
