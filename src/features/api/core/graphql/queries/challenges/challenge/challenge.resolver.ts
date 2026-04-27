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
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    ChallengeEntity,
    Locale,
} from "@modules/databases"
import {
    ChallengeRequest,
    ChallengeResponse,
} from "./graphql-types"
import {
    ChallengeQueryService,
} from "./challenge.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"

@Resolver(() => ChallengeEntity)
export class ChallengeResolver {
    constructor(
        private readonly challengeQueryService: ChallengeQueryService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Challenge fetched successfully",
        [Locale.Vi]: "Lấy challenge thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
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
