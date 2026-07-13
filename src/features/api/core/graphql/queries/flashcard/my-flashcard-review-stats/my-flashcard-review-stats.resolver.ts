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
    MyFlashcardReviewStatsService,
} from "./my-flashcard-review-stats.service"
import {
    MyFlashcardReviewStatsData,
    MyFlashcardReviewStatsResponse,
} from "./graphql-types"

/**
 * The viewer's aggregated flashcard review ("Học thẻ") stats for one course —
 * a reviewed-count/XP trend line plus a per-deck breakdown across their
 * recent completed sessions. Mirrors `myFlashcardQuizStats`, minus `byTag`
 * (see `MyFlashcardReviewStatsService`'s own doc). Enrollment-scoped, same
 * as `myFlashcardReviewHistory`.
 */
@Resolver()
export class MyFlashcardReviewStatsResolver {
    constructor(
        private readonly myFlashcardReviewStatsService: MyFlashcardReviewStatsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Flashcard review stats fetched successfully",
        [Locale.Vi]: "Lấy thống kê ôn tập thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyFlashcardReviewStatsResponse,
        {
            name: "myFlashcardReviewStats",
            description: "The viewer's aggregated flashcard review stats for one course.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("courseId",
            {
                type: () => ID,
                description: "Course whose flashcard review stats to compute.",
            })
            courseId: string,
    ): Promise<MyFlashcardReviewStatsData> {
        const result = await this.myFlashcardReviewStatsService.compute({
            userId: user.id,
            courseId,
        })
        return {
            dailyActivity: result.dailyActivity,
            byDeck: result.byDeck,
            dueToday: result.dueToday,
            dueForecast: result.dueForecast,
            masteryBreakdown: result.masteryBreakdown,
            leechCards: result.leechCards,
            weakReviewTag: result.weakReviewTag,
            deckRetention: result.deckRetention,
            retentionTrend: result.retentionTrend,
        }
    }
}
