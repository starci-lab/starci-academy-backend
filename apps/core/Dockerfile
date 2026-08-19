
# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

ARG NODE_VERSION=25.2.1

################################################################################
# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-alpine AS base

# Set working directory for all build stages.
WORKDIR /usr/src/app

################################################################################
# Create a stage for installing production dependecies.
FROM base AS deps

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.npm to speed up subsequent builds.
# Leverage bind mounts to package.json and package-lock.json to avoid having to copy them
# into this layer.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

################################################################################
# Create a stage for building the application.
FROM deps AS build

# Download additional development dependencies before building, as some projects require
# "devDependencies" to be installed to build. If you don't need this, remove this step.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci

# Copy the rest of the source files into the image.
COPY . .
# Run the build script.
RUN npx nest build core

################################################################################
# Create a new stage to run the application with minimal runtime dependencies
# where the necessary files are copied from the build stage.
FROM base AS final

# Download and install MongoDB Database Tools, pg_dump/pg_restore, 7z, the
# backup encryption/compression tools, and tectonic — a self-contained LaTeX
# engine (single binary, no TeXLive install) used to compile AI-generated CVs'
# .tex into a real PDF (packages fetch on demand from its bundle at compile
# time — the container needs network egress for this) — all in one layer.
RUN apk add --no-cache \
    --repository=http://dl-cdn.alpinelinux.org/alpine/edge/testing \
    mongodb-tools \
 && chmod +x /usr/bin/mongo* || true \
 && apk add --no-cache postgresql17-client \
 && apk update && apk add --no-cache p7zip \
 && apk add --no-cache openssl gzip \
 && apk add --no-cache tectonic

# Use production node environment by default.
ENV NODE_ENV production

# Run the application as root. The ".contexts cache" this comment used to name
# is DEAD in prod: commit 243ddde7 replaced it with a dedicated .datasources
# bind (see apps/core/vps-compose.yaml) -- DataGitBootstrapService still
# mkdir/writeFile/cp/rm's real snapshot data there on every boot, so root (or
# a chown) is still genuinely required, just against a different host path.
# There are TWO host-permission layers to fix before `USER node` is safe, and
# both live under /root (default Linux perms make /root itself 0700 root:root,
# which blocks uid 1000 from traversing into it at all, independent of what
# the subdirs below are chowned to):
#   1. /root/academy/.datasources  (WRITE target)      -> must become owned/
#      group-owned by uid 1000, e.g. `chown -R 1000:1000 /root/academy/.datasources`
#   2. /root/academy/.mount        (READ-only for the app -- confirmed no
#      write call sites in src/modules/filesystem, src/modules/lib/assets) ->
#      the app only needs read+traverse for uid 1000, but at least one file
#      here is deliberately root-only: the deploy workflow's "Write qwen
#      local-provider key" step does `install -d -m 700 .../terraform/keys`
#      + `chmod 600 local.key`, which today only readable by root. Give uid
#      1000 group-read instead of loosening to world-readable, e.g.
#      `chown -R root:1000 /root/academy/.mount && chmod -R g+rX,o-rwx /root/academy/.mount`.
# Either loosen /root's own mode (`chmod o+x /root`, touches a system dir) or
# relocate both binds outside /root (e.g. /srv/academy/...) -- an ops decision,
# not one to make blind from a sandbox with no VPS access. Verify current
# ownership/mode on the VPS first (`stat -c '%a %U:%G' /root /root/academy/.mount
# /root/academy/.mount/terraform/keys/local.key /root/academy/.datasources`),
# then re-enable `USER node` and redeploy watching the first boot's init logs
# (DataGitBootstrapService write + AI local-key load) for permission errors.
# USER node

# Copy package.json so that package manager commands can be used.
COPY package.json .

# Copy the production dependencies from the deps stage and also
# the built application from the build stage into the image.
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist/apps/core .
# COPY the templates to the image.
COPY templates /usr/src/app/templates
# Brand assets (course/tech logos) are not baked into the image — they live in
# the bind-mounted `.mount/assets` so AssetsService syncs them to MinIO on boot.

# Expose the port that the application listens on.
EXPOSE 20860
# Run the application.
CMD ["node", "main"]
