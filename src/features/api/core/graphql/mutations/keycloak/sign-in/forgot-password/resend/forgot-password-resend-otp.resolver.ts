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
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
} from "@modules/databases"
import {
    SignInResponse,
    type SignInInitData,
} from "../../init/graphql-types"
import {
    ForgotPasswordResendOtpRequest,
} from "./graphql-types"
import {
    ForgotPasswordResendOtpService,
} from "./forgot-password-resend-otp.service"

@Resolver()
export class ForgotPasswordResendOtpResolver {
    constructor(
        private readonly forgotPasswordResendOtpService: ForgotPasswordResendOtpService,
    ) {}

    @UseThrottler(ThrottlerConfig.Strict)
    @GraphQLSuccessMessage({
        [Locale.En]: "OTP sent successfully",
        [Locale.Vi]: "G?i mã OTP thành công",
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