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
} from "../init/graphql-types/response"
import {
    SignInResendOtpRequest,
} from "./graphql-types/request"
import {
    SignInResendOtpService,
} from "./sign-in-resend-otp.service"

@Resolver()
/**
 * GraphQL entry for resending a sign-in OTP. Strict throttle only -- captcha
 * already gated init, and resend requires a live challenge id.
 */
export class SignInResendOtpResolver {
    constructor(
        private readonly signInResendOtpService: SignInResendOtpService,
    ) {}

    @UseThrottler(ThrottlerConfig.Strict)
    @GraphQLSuccessMessage({
        [Locale.En]: "OTP sent successfully",
        [Locale.Vi]: "Gửi mã OTP thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SignInResponse,
        {
            name: "signInResendOtp",
            description: "Resends the sign-in OTP for an existing challenge (same challenge id).",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Challenge id from signInInit.",
            },
        )
            request: SignInResendOtpRequest,
    ): Promise<SignInInitData> {
        return this.signInResendOtpService.execute(
            {
                request,
            }
        )
    }
}
