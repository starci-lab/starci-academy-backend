#!/usr/bin/env bash
set -euo pipefail
if [[ "${1:-}" == ./scripts/workers ]]; then
  # Docker supplies a PRIVATE cgroup namespace. These paths belong to this
  # container; do not mount the host's cgroup hierarchy into the container.
  sudo bash -euo pipefail -c '
    test -f /sys/fs/cgroup/cgroup.controllers
    test "$(cat /proc/1/cgroup)" = "0::/"
    mkdir -p /sys/fs/cgroup/service
    mapfile -t pids < /sys/fs/cgroup/cgroup.procs
    for pid in "${pids[@]}"; do
      if test -e "/proc/$pid"; then
        printf "%s\n" "$pid" > /sys/fs/cgroup/service/cgroup.procs
      fi
    done
    printf "+cpu +memory +pids\n" > /sys/fs/cgroup/cgroup.subtree_control
    mkdir -p /sys/fs/cgroup/isolate
    printf "+cpu +memory +pids\n" > /sys/fs/cgroup/isolate/cgroup.subtree_control
    isolate --cg --box-id=999 --init >/dev/null
    isolate --cg --box-id=999 --cleanup
  '
fi
exec /api/docker-entrypoint.sh "$@"
