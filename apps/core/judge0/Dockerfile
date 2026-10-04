# Keep the existing Judge0 API/compilers and replace its cgroup-v1-only sandbox.
FROM alpine:3.22 AS isolate-build
RUN apk add --no-cache build-base linux-headers pkgconf curl libcap-dev libcap-static libseccomp-dev libseccomp-static
WORKDIR /build
RUN curl -fsSL https://github.com/ioi/isolate/archive/8f185bb37f3f23e29b33b0c7727c91c13429abe3.tar.gz | tar -xz --strip-components=1 \
 && make isolate LDFLAGS=-static CFLAGS_EXTRA='-include asm/unistd.h -DSYS_quotactl_fd=__NR_quotactl_fd' \
 && ./isolate --version

FROM judge0/judge0@sha256:6b5d6a66aa19a8e878a52ea3c6a560afc1086734d96e2885b561fd5c6018f082
USER root
COPY --from=isolate-build --chmod=4755 /build/isolate /usr/local/bin/isolate
COPY --from=isolate-build /build/LICENSE /usr/local/share/isolate-LICENSE
COPY apps/core/judge0/isolate.conf /usr/local/etc/isolate
COPY --chmod=755 apps/core/judge0/entrypoint.sh /usr/local/bin/academy-judge0-entrypoint
# Isolate v2 always uses aggregate cgroup CPU accounting. These old flags were
# removed upstream; retain Judge0's API and all remaining resource limits.
RUN sed -i 's/--no-cg-timing//g; s/--cg-timing//g' /api/app/jobs/isolate_job.rb \
 && mkdir -p /var/local/lib/isolate /run/isolate/locks \
 && chmod 755 /var/local/lib/isolate /run/isolate /run/isolate/locks
USER judge0
ENTRYPOINT ["/usr/local/bin/academy-judge0-entrypoint"]
