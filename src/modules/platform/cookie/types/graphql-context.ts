import type {
    Request
} from "express"

/** Shape of the GraphQL execution context holding the Express request. */
export interface GraphQLContextRequest {
    /** The underlying Express request for the current GraphQL operation. */
    req: Request
}
