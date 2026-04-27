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
    ExchangeCodeForTokenRequest,
    ExchangeCodeForTokenResponse,
    type ExchangeCodeForTokenData,
} from "./graphql-types"
import {
    ExchangeCodeForTokenService,
} from "./exchange-code-for-token.service"

@Resolver()
export class ExchangeCodeForTokenResolver {
    constructor(
        private readonly exchangeCodeForTokenService: ExchangeCodeForTokenService,
    ) {}

    @UseThrottler(ThrottlerConfig.Strict)
    @GraphQLSuccessMessage({
        [Locale.En]: "Code exchanged successfully",
        [Locale.Vi]: "Đổi code lấy token thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => ExchangeCodeForTokenResponse,
        {
            name: "exchangeCodeForToken",
            description: "Exchange OIDC authorization code for Keycloak tokens (server-side).",
        },
    )
    async execute(
        @Args("request")
            request: ExchangeCodeForTokenRequest,
    ): Promise<ExchangeCodeForTokenData> {
        return this.exchangeCodeForTokenService.execute(request)
    }
}

