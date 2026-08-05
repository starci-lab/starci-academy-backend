import type {
    Request,
} from "express"

/**
 * Resolves the public origin (`scheme://host`) a request arrived on.
 *
 * The presigned-URL lesson needs to hand the browser an absolute URL that
 * points back at this very service, whether it is reached directly on
 * `localhost:3002` or through the `mock.starci.org` reverse proxy -- so we
 * prefer the `x-forwarded-*` headers the proxy sets and fall back to the
 * request's own protocol/host otherwise.
 */
export const resolveRequestOrigin = (request: Request): string => {
    // a proxy terminates TLS, so trust its forwarded scheme/host when present
    const forwardedProto = firstHeaderValue(request.headers["x-forwarded-proto"])
    const forwardedHost = firstHeaderValue(request.headers["x-forwarded-host"])

    const protocol = forwardedProto ?? request.protocol
    const host = forwardedHost ?? request.headers.host ?? "localhost"

    return `${protocol}://${host}`
}

/** Returns the first value of a possibly comma-joined / array header. */
const firstHeaderValue = (value: string | Array<string> | undefined): string | undefined => {
    if (Array.isArray(value)) {
        return value[0]
    }
    // forwarded headers may be a comma-separated chain -- take the first hop
    return value?.split(",")[0]?.trim() || undefined
}
