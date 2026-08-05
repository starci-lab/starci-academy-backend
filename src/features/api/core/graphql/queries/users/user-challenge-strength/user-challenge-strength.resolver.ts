import {
    Args,
    ID,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-optional-auth-graphql.guard"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    GraphQLProfileVisibilityGuard,
} from "@modules/bussiness/guards/graphql-profile-visibility.guard"
import {
    UserSolvedChallengesProjectionService,
} from "@modules/bussiness/projections/user-solved-challenges/user-solved-challenges-projection.service"
import {
    ChallengeStrengthObject,
    UserChallengeStrengthResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Public profile query: a user's DERIVED challenge-strength standing -- a
 * percentile + 1-based global rank by a difficulty-weighted sum over their
 * distinct passed challenges. Purely derived (does NOT touch the points / XP /
 * league economy); thin read off the per-user CQRS solved-challenges projection
 * (the strength score is already materialised in the jsonb value). Both fields
 * null when the user has no passes. Optional auth; a locked profile is withheld
 * by {@link GraphQLProfileVisibilityGuard}.
 */
export class UserChallengeStrengthResolver {
    constructor(
        private readonly userSolvedChallengesProjectionService: UserSolvedChallengesProjectionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard,
        GraphQLProfileVisibilityGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Challenge strength fetched successfully",
        [Locale.Vi]: "Lấy độ mạnh thử thách thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => UserChallengeStrengthResponse,
        {
            name: "userChallengeStrength",
            description: "A user's derived challenge-strength percentile + global rank, by user id (null when no passes).",
        },
    )
    async execute(
        @Args(
            "userId",
            {
                type: () => ID,
                description: "Id of the user whose challenge strength to fetch.",
            },
        )
            userId: string,
    ): Promise<ChallengeStrengthObject> {
        // thin projection read (strength score already materialised; rank computed over the rows)
        return this.userSolvedChallengesProjectionService.getChallengeStrength(userId)
    }
}
