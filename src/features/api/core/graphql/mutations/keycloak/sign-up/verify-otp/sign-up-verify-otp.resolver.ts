import {
    Args,
    Context,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
} from "@modules/databases"
import type {
    Response,
    Request,
} from "express"
import {
    CookieName,
    CookieService,
} from "@modules/cookie"
import {
    SignUpVerifyOtpInput,
    SignUpVerifyOtpResponse,
    type SignUpVerifyOtpData,
} from "./graphql-types"
import {
    SignUpVerifyOtpService,
} from "./sign-up-verify-otp.service"

@Resolver()
export class SignUpVerifyOtpResolver {
    constructor(
        private readonly signUpVerifyOtpService: SignUpVerifyOtpService,
        private readonly cookieService: CookieService,
    ) {}

    @UseThrottler(ThrottlerConfig.Strict)
    @GraphQLSuccessMessage({
        [Locale.En]: "Signed up successfully",
        [Locale.Vi]: "Đăng ký thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SignUpVerifyOtpResponse,
        {
            name: "signUpVerifyOtp",
            description: "Verifies OTP and returns Keycloak access token; refresh token is set as HttpOnly cookie.",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Challenge id + OTP code.",
            },
        )
            request: SignUpVerifyOtpInput,
        @Context()
            ctx: {
                req: Request,
                res: Response,
            },
    ): Promise<SignUpVerifyOtpData> {
        const result = await this.signUpVerifyOtpService.execute(
            {
                request,
            }
        )

        this.cookieService.attachHttpOnlyCookie(
            {
                res: ctx.res,
                name: CookieName.KeycloakRefreshToken,
                value: result.refreshToken,
            }
        )

        return result.data
    }
}

