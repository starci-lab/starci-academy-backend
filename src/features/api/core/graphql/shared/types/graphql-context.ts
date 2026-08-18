import type {
    Request,
    Response,
} from "express"

/**
 * GraphQL execution context shape exposed by Apollo's NestJS driver, carrying
 * both the underlying Express request and response -- needed by any resolver
 * that attaches an HTTP-only cookie or reads request metadata (User-Agent,
 * client IP) as a side effect of the mutation.
 */
export interface GraphQLContextParams {
    /** The underlying Express request for the current GraphQL operation. */
    req: Request
    /** The underlying Express response, used to attach/clear cookies. */
    res: Response
}
