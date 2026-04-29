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
    ForgotPasswordInitRequest,
} from "./graphql-types"
import {
    ForgotPasswordInitService,
} from "./forgot-password-init.service"

@Resolver()
export class ForgotPasswordInitResolver {
    constructor(
        private readonly forgotPasswordInitService: ForgotPasswordInitService,
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