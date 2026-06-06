/**
 * Request header through which the client sends the Cloudflare Turnstile
 * token obtained from the widget.
 */
export const CAPTCHA_HEADER_NAME = "x-captcha-token"

/** Cloudflare Turnstile server-side verification endpoint. */
export const TURNSTILE_SITEVERIFY_URL =
    "https://challenges.cloudflare.com/turnstile/v0/siteverify"

/** Axios instance cache key for the Turnstile client. */
export const CAPTCHA_AXIOS_KEY = "turnstile"
