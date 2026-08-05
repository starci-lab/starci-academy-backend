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
    SignInResponse,
    type SignInInitData,
} from "../../init/graphql-types/response"
import {
    ForgotPasswordInitRequest,
} from "./graphql-types/request"
import {
    ForgotPasswordInitService,
} from "./forgot-password-init.service"
import {
    CaptchaGuard,
} from "@modules/integrations/captcha/guards/captcha.guard"

@Resolver()
/**
 * GraphQL entry for starting password reset. Captcha + strict throttle exist
 * to stop unauthenticated OTP spam against arbitrary emails.
 */
export class ForgotPasswordInitResolver {
    constructor(
        private readonly forgotPasswordInitService: ForgotPasswordInitService,
    ) {}

    @UseGuards(CaptchaGuard)
    @UseThrottler(ThrottlerConfig.Strict)
    @GraphQLSuccessMessage({
        [Locale.En]: "OTP sent successfully",
        [Locale.Vi]: "G?i m� OTP th�nh c�ng",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SignInResponse,
        {
            name: "forgotPasswordInit",
            description: "Initiates forgot-password flow and sends OTP to email.",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Email and new password for reset flow.",
            },
        )
            request: ForgotPasswordInitRequest,
    ): Promise<SignInInitData> {
        return this.forgotPasswordInitService.execute(
            {
                request,
            },
        )
    }
}