FROM golang:1.24.2-alpine AS build
RUN apk add --no-cache ca-certificates curl
WORKDIR /build
RUN curl -fsSL https://github.com/minio/minio/archive/0d7408fc9969caf07de6a8c3a84f9fbb10a6739e.tar.gz | tar -xz --strip-components=1
RUN CGO_ENABLED=0 go build -trimpath -o /minio .

FROM alpine:3.22
RUN apk add --no-cache ca-certificates
LABEL org.opencontainers.image.source="https://github.com/minio/minio" \
      org.opencontainers.image.revision="0d7408fc9969caf07de6a8c3a84f9fbb10a6739e" \
      org.opencontainers.image.licenses="AGPL-3.0-only"
COPY --from=build /minio /usr/local/bin/minio
COPY --from=build /build/LICENSE /usr/share/licenses/minio/LICENSE
ENTRYPOINT ["minio"]
