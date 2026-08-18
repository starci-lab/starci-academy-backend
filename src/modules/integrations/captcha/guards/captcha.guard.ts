import {
    CanActivate,
    ExecutionContext,
    Injectable,
} from "@nestjs/common"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import type {
    Request,
} from "express"
import {
    CaptchaVerificationFailedException,
} from "@modules/platform/exceptions/errors/guards/captcha-verification-failed"
import {
    CaptchaService,
} from "../captcha.service"
import {
    CAPTCHA_HEADER_NAME,
} from "../constants"
import type {
    GraphQLContextParams,
} from "../types/graphql-context"

@Injectable()
/**
 * Guard requiring a valid Cloudflare Turnstile token (in the `X-Captcha-Token`
 * header) on bot-sensitive entry mutations (sign-in / sign-up / forgot-password
 * init). No-ops transparently when captcha is disabled via config.
 *
 * @example
 * \@UseGuards(CaptchaGuard)
 * \@Mutation(() => SignInResponse)
 */
export class CaptchaGuard implements CanActivate {
    constructor(
        private readonly captchaService: CaptchaService,
    ) { }

    /**
     * Validates the captcha token for the incoming request (GraphQL or REST).
     *
     * @param context - The Nest execution context.
     * @returns True when the captcha passes (or is disabled).
     */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        // resolve the underlying express request across transports
        const request = this.resolveRequest(context)
        // read the Turnstile token the client mirrored into the header
        const token = this.readHeaderToken(request)
        // derive a best-effort client IP to forward to Cloudflare
        const remoteIp = this.resolveRemoteIp(request)
        // verify with Cloudflare (returns true immediately when disabled)
        const valid = await this.captchaService.verify({
            token: token ?? "",
            remoteIp,
        })
        // a failed/absent captcha blocks the bot-sensitive mutation
        if (!valid) {
            throw new CaptchaVerificationFailedException({
            })
        }
        // captcha satisfied -> allow the mutation through
        return true
    }

    /**
     * Resolves the express request from a GraphQL or REST execution context.
     *
     * @param context - The Nest execution context.
     * @returns The express request.
     */
    private resolveRequest(context: ExecutionContext): Request {
        // GraphQL keeps the request on the gql context's `req`
        if (context.getType<string>() === "graphql") {
            return GqlExecutionContext.create(context).getContext<GraphQLContextParams>().req
        }
        // REST exposes it directly on the HTTP host
        return context.switchToHttp().getRequest<Request>()
    }

    /**
     * Reads and normalizes the captcha header value.
     *
     * @param request - The incoming express request.
     * @returns The token string, or undefined when absent.
     */
    private readHeaderToken(request: Request): string | undefined {
        // header values may be string | string[] | undefined
        const raw = request.headers[CAPTCHA_HEADER_NAME]
        // collapse arrays to the first element
        return Array.isArray(raw) ? raw[0] : raw
    }

    /**
     * Derives a best-effort client IP (first X-Forwarded-For hop, else socket).
     *
     * @param request - The incoming express request.
     * @returns The client IP, or null when unknown.
     */
    private resolveRemoteIp(request: Request): string | null {
        // X-Forwarded-For may be a list "client, proxy1, ..." -> take first hop
        const forwarded = request.headers["x-forwarded-for"]
        const firstForwarded = Array.isArray(forwarded) ? forwarded[0] : forwarded
        // prefer the forwarded client address, else the socket address
        if (firstForwarded) {
            return firstForwarded.split(",")[0]?.trim() ?? null
        }
        return request.ip ?? null
    }
}
