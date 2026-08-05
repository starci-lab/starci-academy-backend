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
    SignInInitRequest,
    SignInResponse,
    type SignInInitData,
} from "./graphql-types"
import {
    SignInInitService,
} from "./sign-in-init.service"
import {
    CaptchaGuard,
} from "@modules/captcha"

@Resolver()
/**
 * GraphQL entry for starting password sign-in. Captcha + strict throttle exist
 * to stop credential stuffing from minting OTP mail storms.
 */
export class SignInInitResolver {
    constructor(
        private readonly signInInitService: SignInInitService,
    ) {}

    /**
     * Execute the sign in init command.
     * @param request - The sign in init request.
     * @returns The sign in init data.
     */
    @UseGuards(CaptchaGuard)
    @UseThrottler(ThrottlerConfig.Strict)
    @GraphQLSuccessMessage({
        [Locale.En]: "OTP sent successfully",
        [Locale.Vi]: "Gửi mã OTP thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SignInResponse,
        {
            name: "signInInit",
            description: "Verifies username/password with Keycloak, then sends OTP to email (tokens returned only after OTP).",
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
    ): Promise<SignInInitData> {
        return this.signInInitService.execute(
            {
                request,
            }
        )
    }
}

