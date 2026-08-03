/** Params for GET request via a pre-loaded Next.js page. */
export interface NextJsQueryGetParams {
    /** Base URL of the Next.js app to request from. */
    baseUrl: string
    /** Path appended to the base URL for the GET request. */
    path: string
    /** Optional query string parameters to append to the request. */
    params?: Record<string, string | number | boolean>
}

/** Result of NextJsQuery get (parsed JSON). */
export type NextJsQueryGetResult<T> = T
