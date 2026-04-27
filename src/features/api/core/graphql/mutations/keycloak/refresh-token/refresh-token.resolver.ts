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
    RefreshTokenRequest,
    RefreshTokenResponse,
    type RefreshTokenData,
} from "./graphql-types"
import {
    RefreshTokenService,
} from "./refresh-token.service"

@Resolver()
export class RefreshTokenResolver {
    constructor(
        private readonly refreshTokenService: RefreshTokenService,
    ) {}

    @UseThrottler(ThrottlerConfig.Strict)
    @GraphQLSuccessMessage({
        [Locale.En]: "Token refreshed successfully",
        [Locale.Vi]: "Làm mới token thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => RefreshTokenResponse,
        {
            name: "refresh",
            description: "Refresh Keycloak tokens using refresh token.",
        },
    )
    async execute(
        @Args("request")
            request: RefreshTokenRequest,
    ): Promise<RefreshTokenData> {
        return this.refreshTokenService.execute(request)
    }
}

