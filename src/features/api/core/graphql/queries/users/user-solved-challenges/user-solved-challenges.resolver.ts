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
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
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
    toGlobalId,
} from "@modules/platform/routing/utils/global-id"
import {
    UserSolvedChallengeItemData,
    UserSolvedChallengesResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Public profile query: a user's passed challenge submissions + their submitted
 * git / docs link + language. Thin read of the CQRS solved-challenges projection
 * (the DISTINCT-ON join runs in the projection's recompute). Optional auth; a
 * locked profile is withheld by {@link GraphQLProfileVisibilityGuard}.
 */
export class UserSolvedChallengesResolver {
    constructor(
        private readonly userSolvedChallengesProjectionService: UserSolvedChallengesProjectionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard,
        GraphQLProfileVisibilityGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Solved challenges fetched successfully",
        [Locale.Vi]: "Lấy challenge đã giải thành công", // vn-ok: vi-locale string emitted to clients
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
            id: challenge.id,
            title: challenge.title,
            submissionUrl: challenge.submissionUrl,
            submissionType: challenge.submissionType,
            selectedLang: challenge.selectedLang,
            difficulty: challenge.difficulty,
            score: challenge.score,
            courseTitle: challenge.courseTitle,
            courseGlobalId: challenge.courseId
                ? toGlobalId(CourseEntity.name,
                    challenge.courseId)
                : null,
            courseSlug: challenge.courseSlug,
            passedAt: challenge.passedAt,
        }))
    }
}
