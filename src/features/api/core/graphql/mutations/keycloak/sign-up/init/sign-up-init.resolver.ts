import {
    Args,
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
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
} from "@modules/databases"
import {
    SignUpInitRequest,
    SignUpResponse,
    type SignUpInitData,
} from "./graphql-types"
import {
    SignUpInitService,
} from "./sign-up-init.service"
import {
    CaptchaGuard,
} from "@modules/captcha"

@Resolver()
/**
 * GraphQL entry for starting sign-up. Captcha + strict throttle exist to stop
 * unauthenticated account-creation and OTP mail storms.
 */
export class SignUpInitResolver {
    constructor(
        private readonly signUpInitService: SignUpInitService,
    ) {}

    @UseGuards(CaptchaGuard)
    @UseThrottler(ThrottlerConfig.Strict)
    @GraphQLSuccessMessage({
        [Locale.En]: "OTP sent successfully",
        [Locale.Vi]: "Gửi mã OTP thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SignUpResponse,
        {
            name: "signUpInit",
            description: "Creates a Keycloak user then sends OTP to email (tokens returned only after OTP).",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Sign-up information (email/password and optional profile fields).",
            },
        )
            request: SignUpInitRequest,
    ): Promise<SignUpInitData> {
        return this.signUpInitService.execute(
            {
                request,
            }
        )
    }
}

