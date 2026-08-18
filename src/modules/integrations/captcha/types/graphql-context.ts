import type {
    Request,
} from "express"

/** Shape of the GraphQL execution context holding the underlying express request. */
export interface GraphQLContextParams {
    /** The underlying express request carried on the GraphQL context. */
    req: Request
}
