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
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"
import {
    MyMockInterviewStatsService,
} from "./my-mock-interview-stats.service"
import {
    MyMockInterviewStatsData,
    MyMockInterviewStatsResponse,
} from "./graphql-types"

/**
 * The viewer's aggregated mock-interview stats for one course — an
 * overall-score trend, a mode split, per-phase (design) / per-kind (qna)
 * breakdowns, and the single weakest entry across both axes — so the setup
 * screen's "Thống kê" tab has progress data without the client re-deriving
 * any of it. Enrolled-only, same surface as `myMockInterviewAttempts`.
 */
@Resolver()
export class MyMockInterviewStatsResolver {
    constructor(
        private readonly myMockInterviewStatsService: MyMockInterviewStatsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Mock interview stats fetched successfully",
        [Locale.Vi]: "Lấy thống kê phỏng vấn thử thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyMockInterviewStatsResponse,
        {
            name: "myMockInterviewStats",
            description: "The viewer's aggregated mock-interview stats for one course.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("courseId",
            {
                type: () => ID,
                description: "Course whose mock-interview stats to compute.",
            })
            courseId: string,
    ): Promise<MyMockInterviewStatsData> {
        const result = await this.myMockInterviewStatsService.compute({
            userId: user.id,
            courseId,
        })
        // project to the GraphQL shape — serialize each trend point's timestamp
        return {
            insufficientData: result.insufficientData,
            modeSplit: result.modeSplit,
            trend: result.trend.map((point) => ({
                completedAt: point.completedAt.toISOString(),
                overallScore: point.overallScore,
                mode: point.mode,
                verdict: point.verdict,
            })),
            byPhase: result.byPhase,
            byKind: result.byKind,
            byAttribute: result.byAttribute,
            byLevel: result.byLevel,
            byLanguage: result.byLanguage,
            recurringGaps: result.recurringGaps,
            weakest: result.weakest,
            verdictCounts: result.verdictCounts,
        }
    }
}
