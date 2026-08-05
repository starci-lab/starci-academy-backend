import {
    Args,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
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
    ForgotPasswordResendOtpRequest,
} from "./graphql-types/request"
import {
    ForgotPasswordResendOtpService,
} from "./forgot-password-resend-otp.service"

@Resolver()
/**
 * GraphQL entry for resending a reset OTP. Strict throttle only � captcha
 * already gated init, and resend requires a live challenge id.
 */
export class ForgotPasswordResendOtpResolver {
    constructor(
        private readonly forgotPasswordResendOtpService: ForgotPasswordResendOtpService,
    ) {}

    @UseThrottler(ThrottlerConfig.Strict)
    @GraphQLSuccessMessage({
        [Locale.En]: "OTP sent successfully",
        [Locale.Vi]: "G?i m� OTP th�nh c�ng",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SignInResponse,
        {
            name: "forgotPasswordResendOtp",
            description: "Resends forgot-password OTP for an existing challenge.",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Challenge id from forgotPasswordInit.",
            },
        )
            request: ForgotPasswordResendOtpRequest,
    ): Promise<SignInInitData> {
        return this.forgotPasswordResendOtpService.execute(
            {
                request,
            },
        )
    }
}