#!/usr/bin/env bash
set -euo pipefail
umask 077

ACADEMY_ROOT=${ACADEMY_ROOT:-/home/nivo/academy}
image=${1:?Usage: deploy-production.sh academy/core:<40-character Git SHA>}
if [[ ! "$image" =~ ^academy/core:[0-9a-f]{40}$ ]]; then
  echo 'Expected an immutable Academy image tagged with its Git SHA' >&2
  exit 2
fi
if [[ "$ACADEMY_ROOT" != /home/nivo/academy ]]; then
  echo 'This deployment is bound to /home/nivo/academy' >&2
  exit 2
fi
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
export ACADEMY_ROOT ACADEMY_CORE_IMAGE="$image"
judge_revision=$(cd "$script_dir/judge0" && sha256sum Dockerfile entrypoint.sh isolate.conf reset-cgroup.patch | sha256sum | cut -d ' ' -f 1)
export ACADEMY_JUDGE0_IMAGE="academy/judge0:cgroup2-$judge_revision"
compose=(docker compose --project-directory "$ACADEMY_ROOT" -p academy -f "$script_dir/production-compose.yaml")
exec 9>"$ACADEMY_ROOT/deploy.lock"
flock -w 600 9
docker image inspect "$image" >/dev/null
if ! docker image inspect "$ACADEMY_JUDGE0_IMAGE" >/dev/null 2>&1; then
  docker build -t "$ACADEMY_JUDGE0_IMAGE" -f "$script_dir/judge0/Dockerfile" "$script_dir/../.."
fi
"${compose[@]}" config --quiet

previous=$(docker inspect academy-core --format '{{.Config.Image}}' 2>/dev/null || true)
rollback() {
  if [[ -n "$previous" && "$previous" != "$image" ]]; then
    export ACADEMY_CORE_IMAGE="$previous"
    "${compose[@]}" up -d --no-deps --pull never core
  fi
}
"${compose[@]}" up -d --no-deps --pull never judge0-server judge0-workers
"${compose[@]}" up -d --no-deps --pull never core
for attempt in $(seq 1 90); do
  status=$(docker inspect academy-core --format '{{if .State.Health}}{{.State.Health.Status}}{{end}}')
  if [[ "$status" == healthy ]]; then
    printf '%s\n' "$image" > "$ACADEMY_ROOT/operations/deployed-image.txt"
    echo "Academy core ready: $image"
    exit 0
  fi
  sleep 5
done
echo 'Academy core did not become ready; restoring its previous image' >&2
rollback
exit 1
