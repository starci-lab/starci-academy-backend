import type {
    Request,
} from "express"

/**
 * GraphQL execution context shape exposed by Apollo's NestJS driver.
 *
 * The driver places the underlying Express request on `req`, mirroring the
 * HTTP context so the same `Authorization` header logic works for both
 * transports.
 */
export interface GraphQLContextRequest {
    /** The underlying Express request carrying headers (e.g. `Authorization`). */
    req: Request
}
