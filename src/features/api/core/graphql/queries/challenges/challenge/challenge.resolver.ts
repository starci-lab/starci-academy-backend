import {
    Args,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLLocale,
} from "@modules/api/apollo/server/decorators/locale.decorators"
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
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ChallengeRequest,
} from "./graphql-types/request"
import {
    ChallengeResponse,
} from "./graphql-types/response"
import {
    ChallengeQueryService,
} from "./challenge.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
@Resolver(() => ChallengeEntity)
/**
 * GraphQL entry for `challenge`: one challenge by id, served from the locale
 * S3 snapshot. Premium content is locked until the caller enrolls.
 */
export class ChallengeResolver {
    constructor(
        private readonly challengeQueryService: ChallengeQueryService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Challenge fetched successfully",
        [Locale.Vi]: "Lấy challenge thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => ChallengeResponse,
        {
            name: "challenge",
            description: "Returns a single challenge by primary id.",
        },
    )
    async execute(
        @Args("request")
            request: ChallengeRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<ChallengeEntity> {
        return this.challengeQueryService.execute(
            {
                request,
                locale,
            },
        )
    }
}
