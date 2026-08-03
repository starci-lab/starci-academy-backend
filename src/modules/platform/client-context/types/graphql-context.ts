import type {
    Request,
} from "express"

/** GraphQL execution context shape exposing the underlying express request. */
export interface GraphQLContextRequest {
    /** The express request carried on the GraphQL context. */
    req: Request
}
