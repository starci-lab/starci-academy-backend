import {
    Args,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLLocale,
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
    LoginInitInput,
    LoginInitResponse,
    type LoginInitData,
} from "./graphql-types"
import {
    LoginInitService,
} from "./login-init.service"

@Resolver()
export class LoginInitResolver {
    constructor(
        private readonly loginInitService: LoginInitService,
    ) {}

    @UseThrottler(ThrottlerConfig.Strict)
    @GraphQLSuccessMessage({
        [Locale.En]: "OTP sent successfully",
        [Locale.Vi]: "Gửi mã OTP thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => LoginInitResponse,
        {
            name: "loginInit",
            description: "Verifies email/password with Keycloak, then sends OTP to email (tokens returned only after OTP).",
        },
    )
    async execute(
        @Args(
            "input",
            {
                description: "Email/password for login initiation.",
            },
        )
            input: LoginInitInput,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<LoginInitData> {
        return this.loginInitService.execute(input,
            locale)
    }
}

