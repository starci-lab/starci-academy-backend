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
    SignUpInitRequest,
    SignUpResponse,
    type SignUpInitData,
} from "./graphql-types"
import {
    SignUpInitService,
} from "./sign-up-init.service"

@Resolver()
export class SignUpInitResolver {
    constructor(
        private readonly signUpInitService: SignUpInitService,
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
            name: "signUpInit",
            description: "Creates a Keycloak user then sends OTP to email (tokens returned only after OTP).",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Sign-up information (email/password and optional profile fields).",
            },
        )
            request: SignUpInitRequest,
    ): Promise<SignUpInitData> {
        return this.signUpInitService.execute(
            {
                request,
            }
        )
    }
}

