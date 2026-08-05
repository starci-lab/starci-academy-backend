import {
    Injectable
} from "@nestjs/common"
import {
    createHmac,
    randomBytes,
    timingSafeEqual
} from "crypto"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    CookieService,
} from "@modules/platform/cookie/cookie.service"
import {
    CookieName,
} from "@modules/platform/cookie/enums"
import {
    CSRF_PAYLOAD_BYTES,
    CSRF_TOKEN_SEPARATOR
} from "./constants"
import type {
    IssueCsrfCookieParams,
    IssueCsrfCookieResult
} from "./types"

@Injectable()
/**
 * Service for the signed double-submit CSRF token scheme.
 *
 * A token is `<random>.<hmac(random)>`. The same value is stored in a
 * JS-readable cookie and must be echoed back by the client in a request
 * header. A cross-site attacker can neither read the cookie nor forge a
 * valid HMAC, so the pair cannot be replicated off-origin.
 *
 * @example
 * const token = csrfService.issueCookie({ res })
 * const ok = csrfService.verify(headerToken)
 */
export class CsrfService {
    constructor(
        private readonly cookieService: CookieService,
    ) { }

    /**
     * Generates a fresh signed token and attaches it as a readable cookie.
     *
     * @param params - The response to attach the cookie to.
     * @returns The raw token value that was set (for callers that also want it).
     *
     * @example
     * csrfService.issueCookie({ res: ctx.res })
     */
    issueCookie({ res }: IssueCsrfCookieParams): IssueCsrfCookieResult {
        // mint a new signed token for this authenticated session
        const token = this.generateToken()
        // when a parent COOKIE_DOMAIN is set, the canonical cookie is domain-scoped;
        // expire any legacy HOST-ONLY csrf_token (issued before the domain rollout) so
        // it stops shadowing it -- cookie-parser reads the first of duplicate names, so
        // a lingering host-only cookie causes a permanent "CSRF token mismatch". A
        // clear with no `domain` (path "/") targets exactly that host-only variant.
        if (envConfig().cookie.domain) {
            this.cookieService.clearCookie({
                res,
                name: CookieName.CsrfToken,
                options: {
                    httpOnly: false,
                    path: "/",
                },
            })
        }
        // expose the canonical token to client-side JS so it can be mirrored into the header
        this.cookieService.attachReadableCookie({
            res,
            name: CookieName.CsrfToken,
            value: token,
        })
        // return the value so a caller could also embed it in the body if needed
        return token
    }

    /**
     * Verifies that a token has an intact HMAC signature.
     *
     * @param token - The token string taken from the request header.
     * @returns True when the signature matches the payload, false otherwise.
     *
     * @example
     * csrfService.verify("ab12...e9.f3c4...")
     */
    verify(token: string): boolean {
        // reject empty/non-string input before any parsing
        if (!token) {
            return false
        }
        // split into the random payload and its claimed signature
        const [payload,
            signature] = token.split(CSRF_TOKEN_SEPARATOR)
        // a well-formed token must carry both halves
        if (!payload || !signature) {
            return false
        }
        // recompute the expected signature over the payload
        const expected = this.sign(payload)
        // length mismatch means timingSafeEqual would throw -- bail early
        if (expected.length !== signature.length) {
            return false
        }
        // constant-time compare to avoid leaking signature bytes via timing
        return timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expected),
        )
    }

    /**
     * Builds a new `<random>.<signature>` token.
     *
     * @returns A freshly signed CSRF token.
     */
    private generateToken(): string {
        // unguessable random payload -- the per-token secret material
        const payload = randomBytes(CSRF_PAYLOAD_BYTES).toString("hex")
        // bind the payload to our server secret so it can't be forged off-site
        return `${payload}${CSRF_TOKEN_SEPARATOR}${this.sign(payload)}`
    }

    /**
     * Computes the HMAC-SHA256 signature of a payload using the server secret.
     *
     * @param payload - The random payload to sign.
     * @returns Hex-encoded HMAC signature.
     */
    private sign(payload: string): string {
        // server-side secret; keyed HMAC prevents client-side forgery
        return createHmac("sha256",
            envConfig().csrf.secret)
            .update(payload)
            .digest("hex")
    }
}
