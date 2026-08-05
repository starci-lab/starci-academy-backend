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
    SignUpResponse,
    type SignUpInitData,
} from "../init/graphql-types/response"
import {
    SignUpResendOtpRequest,
} from "./graphql-types/request"
import {
    SignUpResendOtpService,
} from "./sign-up-resend-otp.service"

@Resolver()
/**
 * GraphQL entry for resending a sign-up OTP. Strict throttle only -- captcha
 * already gated init, and resend requires a live challenge id.
 */
export class SignUpResendOtpResolver {
    constructor(
        private readonly signUpResendOtpService: SignUpResendOtpService,
    ) {}

    @UseThrottler(ThrottlerConfig.Strict)
    @GraphQLSuccessMessage({
        [Locale.En]: "OTP sent successfully",
        [Locale.Vi]: "Gửi mã OTP thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SignUpResponse,
        {
            name: "signUpResendOtp",
            description: "Resends the sign-up OTP for an existing challenge (same challenge id).",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Challenge id from signUpInit.",
            },
        )
            request: SignUpResendOtpRequest,
    ): Promise<SignUpInitData> {
        return this.signUpResendOtpService.execute(
            {
                request,
            }
        )
    }
}
