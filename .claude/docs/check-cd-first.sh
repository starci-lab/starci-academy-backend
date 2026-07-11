#!/usr/bin/env bash
# Gate helper: every fenced ```bash block in a lesson body that contains a RUN command
# (npm install / nest start / mvn spring-boot / dotnet run / go run / dotnet build)
# MUST start with a `cd <...>/backend/<lang>` line (rule coding.md §A2 cd-first).
# Fails (exit = number of offending blocks) so it can be wired into audits / CI.
# Usage: bash .claude/docs/check-cd-first.sh <module-or-lesson-dir>
set -u
[ "$#" -ge 1 ] || { echo "usage: bash check-cd-first.sh <dir>"; exit 2; }
bad=0
for base in "$@"; do
  while IFS= read -r -d '' f; do
    out=$(awk '
      /^```/{ infence=!infence; if(!infence){ if(run && !cd) print FILENAME":"start": RUN-BLOCK without cd-first"; run=0; cd=0; first=0 } else {start=NR; first=1} next }
      infence{
        if($0 ~ /npm (install|ci|run|start)|pnpm |yarn |nest start|mvn |\.\/mvnw|gradle|dotnet (run|watch|restore|build|test)|go (run|build|mod|test)/) run=1;
        if(first && $0 ~ /(^| )cd /) cd=1;
        if($0 !~ /^[[:space:]]*$/ && $0 !~ /^[[:space:]]*#/) first=0   # only the first real line counts as "cd-first"
      }
    ' "$f")
    if [ -n "$out" ]; then echo "$out"; bad=$((bad+1)); fi
  done < <(find "$base" \( -name node_modules -o -name .git \) -prune -o -type f -name '*.md' -path '*/bodies/*' -print0)
done
echo "---- cd-first violations: $bad ----"
exit "$bad"
