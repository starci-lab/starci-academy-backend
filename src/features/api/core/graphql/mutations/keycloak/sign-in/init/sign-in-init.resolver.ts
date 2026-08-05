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

