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
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    GraphQLEnrollmentGuard,
} from "@modules/bussiness"
import {
    MyFlashcardQuizStatsService,
} from "./my-flashcard-quiz-stats.service"
import {
    MyFlashcardQuizStatsData,
    MyFlashcardQuizStatsResponse,
} from "./graphql-types"

/**
 * The viewer's aggregated flashcard quick-quiz ("Hỏi nhanh") stats for one
 * course — a coverage/XP trend line plus per-tag and per-deck breakdowns
 * across their recent completed sessions, so the recap/stats surface has
 * progress data without the client re-deriving any of it. Enrollment-scoped,
 * same as `myFlashcardQuizHistory`.
 */
@Resolver()
export class MyFlashcardQuizStatsResolver {
    constructor(
        private readonly myFlashcardQuizStatsService: MyFlashcardQuizStatsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Flashcard quiz stats fetched successfully",
        [Locale.Vi]: "Lấy thống kê hỏi nhanh thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyFlashcardQuizStatsResponse,
        {
            name: "myFlashcardQuizStats",
            description: "The viewer's aggregated flashcard quick-quiz stats for one course.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("courseId",
            {
                type: () => ID,
                description: "Course whose flashcard quiz stats to compute.",
            })
            courseId: string,
    ): Promise<MyFlashcardQuizStatsData> {
        const result = await this.myFlashcardQuizStatsService.compute({
            userId: user.id,
            courseId,
        })
        // project to the GraphQL shape — serialize each trend point's timestamp
        return {
            insufficientData: result.insufficientData,
            trend: result.trend.map((point) => ({
                completedAt: point.completedAt.toISOString(),
                coverage: point.coverage,
                xpEarned: point.xpEarned,
            })),
            byTag: result.byTag,
            byDeck: result.byDeck,
            weakTagLinks: result.weakTagLinks,
        }
    }
}
