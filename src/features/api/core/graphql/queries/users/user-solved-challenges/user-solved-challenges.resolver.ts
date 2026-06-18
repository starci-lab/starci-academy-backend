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
} from "@modules/api"
import {
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
} from "@modules/databases"
import {
    GraphQLProfileVisibilityGuard,
    UserSolvedChallengesProjectionService,
} from "@modules/bussiness"
import {
    UserSolvedChallengeItemData,
    UserSolvedChallengesResponse,
} from "./graphql-types"

/**
 * Public profile query: a user's passed challenge submissions + their submitted
 * git / docs link + language. Thin read of the CQRS solved-challenges projection
 * (the DISTINCT-ON join runs in the projection's recompute). Optional auth; a
 * locked profile is withheld by {@link GraphQLProfileVisibilityGuard}.
 */
@Resolver()
export class UserSolvedChallengesResolver {
    constructor(
        private readonly userSolvedChallengesProjectionService: UserSolvedChallengesProjectionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard,
        GraphQLProfileVisibilityGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Solved challenges fetched successfully",
        [Locale.Vi]: "Lấy challenge đã giải thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => UserSolvedChallengesResponse,
        {
            name: "userSolvedChallenges",
            description: "A user's passed challenge submissions + submission link + language, by user id.",
        },
    )
    async execute(
        @Args(
            "userId",
            {
                type: () => ID,
                description: "Id of the user whose solved challenges to fetch.",
            },
        )
            userId: string,
    ): Promise<Array<UserSolvedChallengeItemData>> {
        // thin projection read (newest-first)
        const challenges = await this.userSolvedChallengesProjectionService.getChallenges(userId)
        return challenges.map((challenge) => ({
            title: challenge.title,
            submissionUrl: challenge.submissionUrl,
            submissionType: challenge.submissionType,
            selectedLang: challenge.selectedLang,
            difficulty: challenge.difficulty,
            score: challenge.score,
            courseTitle: challenge.courseTitle,
            passedAt: challenge.passedAt,
        }))
    }
}
