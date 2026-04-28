import {
    Args,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    Res,
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
} from "express"
import {
    CookieName,
    CookieService,
} from "@modules/cookie"
import {
    SignInVerifyOtpInput,
    SignInVerifyOtpResponse,
    type SignInVerifyOtpData,
} from "./graphql-types"
import {
    SignInVerifyOtpService,
} from "./sign-in-verify-otp.service"

@Resolver()
export class SignInVerifyOtpResolver {
    constructor(
        private readonly signInVerifyOtpService: SignInVerifyOtpService,
        private readonly cookieService: CookieService,
    ) {}

    @UseThrottler(ThrottlerConfig.Strict)
    @GraphQLSuccessMessage({
        [Locale.En]: "Logged in successfully",
        [Locale.Vi]: "Đăng nhập thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SignInVerifyOtpResponse,
        {
            name: "signInVerifyOtp",
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
            request: SignInVerifyOtpInput,
        @Res()
            res: Response,
    ): Promise<SignInVerifyOtpData> {
        const result = await this.signInVerifyOtpService.execute({
            request,
        })
        this.cookieService.attachHttpOnlyCookie({
            res,
            name: CookieName.KeycloakRefreshToken,
            value: result.refreshToken,
        })
        return result.data
    }
}

