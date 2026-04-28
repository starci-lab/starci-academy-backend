import type {
    CookieOptions, Response 
} from "express"
import {
    CookieName 
} from "../enums"

/** Params for attaching an HttpOnly cookie to the response. */
export interface AttachHttpOnlyCookieParams {
    res: Response
    name: CookieName
    value: string
    options?: CookieOptions
}

/** Result of attaching cookie (void). */
export type AttachHttpOnlyCookieResult = void

/** Params for clearing a cookie by name. */
export interface ClearCookieParams {
    res: Response
    name: CookieName
    options?: CookieOptions
}

/** Result of clearing cookie (void). */
export type ClearCookieResult = void
