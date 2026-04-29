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
    SignUpResponse,
    type SignUpInitData,
} from "../init/graphql-types"
import {
    SignUpResendOtpRequest,
} from "./graphql-types"
import {
    SignUpResendOtpService,
} from "./sign-up-resend-otp.service"

@Resolver()
export class SignUpResendOtpResolver {
    constructor(
        private readonly signUpResendOtpService: SignUpResendOtpService,
    ) {}

    @UseThrottler(ThrottlerConfig.Strict)
    @GraphQLSuccessMessage({
        [Locale.En]: "OTP sent successfully",
        [Locale.Vi]: "Gửi mã OTP thành công",
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
