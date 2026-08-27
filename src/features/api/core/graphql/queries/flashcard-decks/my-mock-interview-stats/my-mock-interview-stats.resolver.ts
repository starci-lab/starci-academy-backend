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
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness/guards/graphql-must-enrolled.guard"
import {
    MyMockInterviewStatsService,
} from "./my-mock-interview-stats.service"
import {
    MyMockInterviewStatsData,
    MyMockInterviewStatsResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * The viewer's aggregated mock-interview stats for one course -- an
 * overall-score trend, a mode split, per-phase (design) / per-kind (qna)
 * breakdowns, and the single weakest entry across both axes -- so the setup
 * screen's stats tab has progress data without the client re-deriving
 * any of it. Enrolled-only, same surface as `myMockInterviewAttempts`.
 */
export class MyMockInterviewStatsResolver {
    constructor(
        private readonly myMockInterviewStatsService: MyMockInterviewStatsService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Mock interview stats fetched successfully",
        [Locale.Vi]: "Lấy thống kê phỏng vấn thử thành công", // vn-ok: vi-locale string emitted to clients
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
        return {
            insufficientData: result.insufficientData,
            comparisonMode: result.comparisonMode,
            comparisonLevel: result.comparisonLevel,
            comparisonRubricVersion: result.comparisonRubricVersion,
            modeSplit: result.modeSplit,
            trend: result.trend.map((point) => ({
                overallScore: point.overallScore,
            })),
            byPhase: result.byPhase,
        }
    }
}
