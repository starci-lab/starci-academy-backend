
# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

ARG NODE_VERSION=25.2.1

################################################################################
# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-alpine as base

# Set working directory for all build stages.
WORKDIR /usr/src/app

################################################################################
# Create a stage for installing production dependecies.
FROM base as deps

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
FROM deps as build

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
FROM base as final

# Download and install MongoDB Database Tools
RUN apk add --no-cache \
    --repository=http://dl-cdn.alpinelinux.org/alpine/edge/testing \
    mongodb-tools \
 && chmod +x /usr/bin/mongo* || true

# Download pg_dump and pg_restore
RUN apk add --no-cache postgresql17-client
# Download 7z
RUN apk update && apk add --no-cache p7zip

# Tools for backup encryption/compression
RUN apk add --no-cache openssl gzip

# Use production node environment by default.
ENV NODE_ENV production

# Run the application as root so it can write the git-mounted .contexts cache
# (bind-mounted from a root-owned host dir) without a host-side chown.
# Re-enable `USER node` + chown the mounts to uid 1000 for a hardened deploy.
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
