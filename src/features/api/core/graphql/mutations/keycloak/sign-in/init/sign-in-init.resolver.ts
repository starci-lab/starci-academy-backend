import {
    Args,
    Context,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    SignInInitRequest,
} from "./graphql-types/request"
import {
    SignInResponse,
    type SignInInitData,
} from "./graphql-types/response"
import {
    SignInInitService,
} from "./sign-in-init.service"
import {
    CaptchaGuard,
} from "@modules/integrations/captcha/guards/captcha.guard"
import type {
    Request,
    Response,
} from "express"
import {
    CookieService,
} from "@modules/platform/cookie/cookie.service"
import {
    CookieName,
} from "@modules/platform/cookie/enums"
import {
    CsrfService,
} from "@modules/platform/csrf/csrf.service"
import {
    SessionService,
} from "@modules/platform/session/session.service"

@Resolver()
/**
 * GraphQL entry for starting password sign-in. Captcha + strict throttle exist
 * to stop credential stuffing from minting OTP mail storms.
 */
export class SignInInitResolver {
    constructor(
        private readonly signInInitService: SignInInitService,
        private readonly cookieService: CookieService,
        private readonly csrfService: CsrfService,
        private readonly sessionService: SessionService,
    ) {}

    /**
     * Execute the sign in init command.
     * @param request - The sign in init request.
     * @returns The sign in init data.
     */
    @UseGuards(CaptchaGuard)
    @UseThrottler(ThrottlerConfig.Strict)
    @GraphQLSuccessMessage({
        [Locale.En]: "Sign-in started successfully",
        [Locale.Vi]: "Bắt đầu đăng nhập thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SignInResponse,
        {
            name: "signInInit",
            description: "Verifies credentials, then opens an OTP challenge or completes an explicitly enabled local test session.",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Username/password for sign-in initiation.",
            },
        )
            request: SignInInitRequest,
        @Context()
            ctx: {
                req: Request
                res: Response
            },
    ): Promise<SignInInitData> {
        const result = await this.signInInitService.execute({
            request,
        })
        if (result.kind === "challenge") return result.data

        this.cookieService.attachHttpOnlyCookie({
            res: ctx.res,
            name: CookieName.KeycloakRefreshToken,
            value: result.refreshToken,
        })
        this.csrfService.issueCookie({
            res: ctx.res,
        })
        await this.sessionService.startSession({
            res: ctx.res,
            req: ctx.req,
            accessToken: result.data.accessToken,
        })
        return result.data
    }
}

