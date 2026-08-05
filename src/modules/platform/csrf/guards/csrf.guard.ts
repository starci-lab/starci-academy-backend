import {
    CanActivate,
    ExecutionContext,
    Injectable
} from "@nestjs/common"
import {
    GqlExecutionContext
} from "@nestjs/graphql"
import {
    timingSafeEqual
} from "crypto"
import type {
    Request
} from "express"
import {
    envConfig
} from "@modules/env"
import {
    CookieService,
    CookieName
} from "@modules/cookie"
import {
    CsrfMissingHttpRequestException,
    CsrfMissingTokenException,
    CsrfTokenMismatchException,
    InvalidCsrfTokenException,
    UntrustedRequestOriginException,
} from "@modules/exceptions"
import {
    CsrfService
} from "../csrf.service"
import {
    CSRF_HEADER_NAME
} from "../constants"

@Injectable()
/**
 * Guard enforcing the signed double-submit CSRF check on cookie-driven
 * GraphQL mutations (refresh / sign-out). It requires the `X-CSRF-Token`
 * header to be present, to match the `csrf_token` cookie, to carry a valid
 * HMAC signature, and the request Origin/Referer (when present) to be an
 * allowed CORS origin.
 *
 * @example
 * \@UseGuards(CsrfGuard)
 * \@Mutation(() => RefreshTokenResponse)
 */
export class CsrfGuard implements CanActivate {
    constructor(
        private readonly csrfService: CsrfService,
        private readonly cookieService: CookieService,
    ) { }

    /**
     * Validates the CSRF token for the incoming GraphQL request.
     *
     * @param context - The Nest execution context (GraphQL).
     * @returns True when the request passes all CSRF checks.
     */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        // pull the underlying express request out of the GraphQL context
        const request = GqlExecutionContext.create(context)
            .getContext<{ req?: Request }>().req
        // without an HTTP request there is nothing to validate -- fail closed
        if (!request) {
            throw new CsrfMissingHttpRequestException({
            })
        }
        // reject obviously cross-site requests before touching the token
        this.assertTrustedOrigin(request)
        // read the token the client mirrored into the header
        const headerToken = this.readHeaderToken(request)
        // read EVERY csrf_token the browser sent -- a COOKIE_DOMAIN rollout can leave
        // a legacy host-only cookie alongside the new domain-scoped one, and
        // cookie-parser would only surface the first (often the stale one)
        const cookieTokens = this.cookieService.getAllCookieValues(request,
            CookieName.CsrfToken)
        // both halves of the double-submit must be present
        if (!headerToken || cookieTokens.length === 0) {
            throw new CsrfMissingTokenException({
            })
        }
        // the header must match ONE of the cookies (constant-time compare). Matching
        // any is safe: every value present was signed + set by us, and a cross-site
        // attacker can neither read these cookies nor forge the HMAC below.
        if (!cookieTokens.some((cookieToken) => this.safeEqual(headerToken,
            cookieToken))) {
            throw new CsrfTokenMismatchException({
            })
        }
        // and the token must carry a signature we actually issued
        if (!this.csrfService.verify(headerToken)) {
            throw new InvalidCsrfTokenException({
            })
        }
        // all checks passed -- allow the mutation through
        return true
    }

    /**
     * Reads and normalizes the CSRF header value from the request.
     *
     * @param request - The incoming express request.
     * @returns The header token string, or undefined when absent.
     */
    private readHeaderToken(request: Request): string | undefined {
        // header lookup is case-insensitive in express; value may be an array
        const raw = request.headers[CSRF_HEADER_NAME]
        // collapse a possible string[] to its first element
        return Array.isArray(raw) ? raw[0] : raw
    }

    /**
     * Rejects the request when its Origin/Referer is not an allowed CORS
     * origin. Absent headers are tolerated (non-browser clients) since the
     * double-submit token remains the primary defense.
     *
     * @param request - The incoming express request.
     */
    private assertTrustedOrigin(request: Request): void {
        // allowed front-end origins, shared with the CORS config
        const allowed = envConfig().cors.origins
        // prefer the Origin header; fall back to deriving it from Referer
        const origin = request.headers.origin
            ?? this.originFromReferer(request.headers.referer)
        // no origin info at all -> let double-submit be the gate
        if (!origin) {
            return
        }
        // an explicit, non-allowlisted origin is a cross-site attempt
        if (!allowed.includes(origin)) {
            throw new UntrustedRequestOriginException({
                origin,
            })
        }
    }

    /**
     * Extracts the scheme+host origin from a Referer URL.
     *
     * @param referer - The raw Referer header value, if any.
     * @returns The origin (e.g. "https://app.example.com") or undefined.
     */
    private originFromReferer(referer?: string): string | undefined {
        // nothing to parse when the header is missing
        if (!referer) {
            return undefined
        }
        try {
            // a Referer is a full URL; its origin is what we compare against
            return new URL(referer).origin
        } catch {
            // malformed Referer -> treat as no usable origin
            return undefined
        }
    }

    /**
     * Constant-time string comparison that never throws on length mismatch.
     *
     * @param left - First string.
     * @param right - Second string.
     * @returns True when the strings are byte-for-byte equal.
     */
    private safeEqual(left: string, right: string): boolean {
        // differing lengths can't be equal and would make timingSafeEqual throw
        if (left.length !== right.length) {
            return false
        }
        // constant-time compare to avoid leaking the token via response timing
        return timingSafeEqual(Buffer.from(left),
            Buffer.from(right))
    }
}
