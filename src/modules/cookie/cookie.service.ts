import {
    Injectable
} from "@nestjs/common"
import type {
    CookieOptions,
    Request
} from "express"
import {
    AttachHttpOnlyCookieParams,
    AttachHttpOnlyCookieResult,
    ClearCookieParams,
    ClearCookieResult
} from "./types"


/**
 * Service for attaching and clearing HttpOnly cookies on Express response.
 * Used for refresh tokens and logout.
 *
 * @example
 * cookieService.attachHttpOnlyCookie({ res, name: "refreshToken", value: token })
 * cookieService.clearCookie({ res, name: "refreshToken" })
 */
@Injectable()
export class CookieService {
    constructor() {}

    /**
     * Attaches a secure HttpOnly cookie to the response.
     * Typically used for refresh tokens (not accessible via JavaScript).
     *
     * @param param - Response, cookie name, value, optional cookie options
     * @returns void
     *
     * @example
     * cookieService.attachHttpOnlyCookie({ res, name: "refreshToken", value: token })
     */
    attachHttpOnlyCookie({
        res,
        name,
        value,
        options,
    }: AttachHttpOnlyCookieParams): AttachHttpOnlyCookieResult {
        const defaultOptions: CookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        }

        res.cookie(name,
            value,
            {
                ...defaultOptions,
                ...options,
            })
    }

    /**
     * Clears a cookie by name (e.g. on logout).
     *
     * @param param - Response, cookie name, optional options
     * @returns void
     *
     * @example
     * cookieService.clearCookie({ res, name: "refreshToken" })
     */
    clearCookie({
        res,
        name,
        options,
    }: ClearCookieParams): ClearCookieResult {
        res.clearCookie(name,
            {
                httpOnly: true,
                sameSite: "strict",
                path: "/",
                ...options,
            })
    }

    /**
     * Safely retrieves a cookie value from a request object.
     * Handles both `req.cookies` (if middleware is used) and manual header parsing.
     *
     * @param req - The incoming request object.
     * @param name - The name of the cookie to retrieve.
     * @returns The cookie value if found, undefined otherwise.
     */
    getCookie(req: Request, name: string): string | undefined {
        if (!req) return undefined

        // 1. Try req.cookies (populated by cookie-parser middleware)
        if (req.cookies?.[name]) {
            return req.cookies[name]
        }

        // 2. Fallback to manual header parsing
        const cookieHeader = req.headers?.cookie
        if (typeof cookieHeader === "string") {
            const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))
            if (match?.[1]) {
                return decodeURIComponent(match[1].trim())
            }
        }

        return undefined
    }
}