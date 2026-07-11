#!/usr/bin/env bash
# Clean residue once a module is DONE (gate PASS + e2e + pushed). "Dọn dần" — chạy per module.
# DELETE (residue):
#   mount: antigravity_test.md (module level), code-context.md (per lesson, pre-audit spec)
#   repo : test_spec.py, __pycache__/, generate-test.js, compose_test.yaml (old test scaffolding), leftover bare lang dirs
# KEEP (audit trail / learner content):
#   vi.md en.md bodies/ challenges/ audited.md research.md decision.md claude_submitted.md synced.yaml .code/ .e2e/
# Usage: [DRYRUN=1] bash .claude/docs/clean-residue.sh <mount-module-dir> [<repo-dir>]
set -u
DRYRUN="${DRYRUN:-1}"
MODDIR="${1:-}"
REPO="${2:-}"
[ -n "$MODDIR" ] || { echo "usage: bash clean-residue.sh <mount-module-dir> [<repo-dir>]"; exit 2; }

rm_path() { # $1 = path to remove
  [ -e "$1" ] || return 0
  if [ "$DRYRUN" = "1" ]; then echo "DRY rm: $1"; else rm -rf "$1" && echo "rm: $1"; fi
}

echo "== MOUNT residue =="
# module-level antigravity test junk
find "$MODDIR" -maxdepth 2 -iname 'antigravity_test.md' 2>/dev/null | while read -r f; do rm_path "$f"; done
# per-lesson pre-audit spec
find "$MODDIR/contents" -maxdepth 2 -name 'code-context.md' 2>/dev/null | while read -r f; do rm_path "$f"; done

if [ -n "$REPO" ] && [ -d "$REPO" ]; then
  echo "== REPO test-scaffolding residue =="
  for pat in 'test_spec.py' 'generate-test.js' 'compose_test.yaml'; do
    find "$REPO" -name "$pat" -not -path '*/node_modules/*' 2>/dev/null | while read -r f; do rm_path "$f"; done
  done
  find "$REPO" -type d -name '__pycache__' -not -path '*/node_modules/*' 2>/dev/null | while read -r d; do rm_path "$d"; done
fi
echo "---- clean-residue done (DRYRUN=$DRYRUN) ----"
