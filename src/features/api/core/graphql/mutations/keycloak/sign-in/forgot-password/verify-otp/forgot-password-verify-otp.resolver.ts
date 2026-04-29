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
    Request,
    Response,
} from "express"
import {
    CookieName,
    CookieService,
} from "@modules/cookie"
import {
    SignInVerifyOtpResponse,
    type SignInVerifyOtpData,
} from "../../verify-otp/graphql-types"
import {
    ForgotPasswordVerifyOtpRequest,
} from "./graphql-types"
import {
    ForgotPasswordVerifyOtpService,
} from "./forgot-password-verify-otp.service"

@Resolver()
export class ForgotPasswordVerifyOtpResolver {
    constructor(
        private readonly forgotPasswordVerifyOtpService: ForgotPasswordVerifyOtpService,
        private readonly cookieService: CookieService,
    ) {}

    @UseThrottler(ThrottlerConfig.Strict)
    @GraphQLSuccessMessage({
        [Locale.En]: "Password reset successfully",
        [Locale.Vi]: "Ð?t l?i m?t kh?u thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SignInVerifyOtpResponse,
        {
            name: "forgotPasswordVerifyOtp",
            description: "Verifies OTP, resets password, and returns login tokens.",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Challenge id + OTP code.",
            },
        )
            request: ForgotPasswordVerifyOtpRequest,
        @Context()
            ctx: {
                req: Request,
                res: Response,
            },
    ): Promise<SignInVerifyOtpData> {
        const result = await this.forgotPasswordVerifyOtpService.execute(
            {
                request,
            },
        )

        this.cookieService.attachHttpOnlyCookie(
            {
                res: ctx.res,
                name: CookieName.KeycloakRefreshToken,
                value: result.refreshToken,
            },
        )

        return result.data
    }
}