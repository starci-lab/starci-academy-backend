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
} from "../init/graphql-types"
import {
    SignInResendOtpRequest,
} from "./graphql-types"
import {
    SignInResendOtpService,
} from "./sign-in-resend-otp.service"

@Resolver()
export class SignInResendOtpResolver {
    constructor(
        private readonly signInResendOtpService: SignInResendOtpService,
    ) {}

    @UseThrottler(ThrottlerConfig.Strict)
    @GraphQLSuccessMessage({
        [Locale.En]: "OTP sent successfully",
        [Locale.Vi]: "Gửi mã OTP thành công",
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
