/** A GraphQL operation entering a flow through the same HTTP door as production. */
export interface FlowGraphqlRequest {
    /** GraphQL document sent to the production endpoint. */
    query: string
    /** Variables referenced by the document. */
    variables?: Record<string, unknown>
    /** Actor and locale headers required by the flow. */
    headers?: Record<string, string>
}

/** The GraphQL response envelope returned by the HTTP transport. */
export interface FlowGraphqlResponse<TData> {
    /** Data returned when execution succeeds. */
    data?: TData
    /** GraphQL errors returned by routing, guards, validation or execution. */
    errors?: Array<{
        message: string
        extensions?: Record<string, unknown>
    }>
}
