/** Plain interface for abstract GraphQL response with optional data. */
export interface IAbstractGraphQLResponse<T = undefined> {
    success: boolean
    message: string
    data?: T
    error?: string
}

/** Internal shape of the transformed GraphQL response (data, message, success, error). */
export interface GraphQLResponse<T = unknown> {
    data?: T
    message: string
    success: boolean
    error?: string
}
