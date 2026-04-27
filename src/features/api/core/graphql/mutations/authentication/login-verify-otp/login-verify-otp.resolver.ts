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
    LoginVerifyOtpInput,
    LoginVerifyOtpResponse,
    type LoginVerifyOtpData,
} from "./graphql-types"
import {
    LoginVerifyOtpService,
} from "./login-verify-otp.service"

@Resolver()
export class LoginVerifyOtpResolver {
    constructor(
        private readonly loginVerifyOtpService: LoginVerifyOtpService,
    ) {}

    @UseThrottler(ThrottlerConfig.Strict)
    @GraphQLSuccessMessage({
        [Locale.En]: "Logged in successfully",
        [Locale.Vi]: "Đăng nhập thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => LoginVerifyOtpResponse,
        {
            name: "loginVerifyOtp",
            description: "Verifies OTP and returns Keycloak tokens.",
        },
    )
    async execute(
        @Args(
            "input",
            {
                description: "Challenge id + OTP code.",
            },
        )
            input: LoginVerifyOtpInput,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<LoginVerifyOtpData> {
        return this.loginVerifyOtpService.execute(input,
            locale)
    }
}

