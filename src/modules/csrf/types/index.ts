import type {
    Response
} from "express"

/** Params for issuing a CSRF token cookie onto a response. */
export interface IssueCsrfCookieParams {
    /** The Express response to attach the readable CSRF cookie to. */
    res: Response
}

/** Result of issuing a CSRF cookie: the raw token value that was set. */
export type IssueCsrfCookieResult = string
