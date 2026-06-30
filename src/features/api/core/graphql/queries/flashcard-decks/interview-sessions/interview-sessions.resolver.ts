import {
    Args,
    ID,
    Int,
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
    InterviewHistoryService,
} from "@modules/bussiness"
import {
    InterviewSessionsData,
    InterviewSessionsResponse,
} from "./graphql-types"

/** Default page size when the client omits `limit`. */
const DEFAULT_LIMIT = 10

/** Hard cap on page size to bound the response. */
const MAX_LIMIT = 50

/**
 * The viewer's mock-interview RUNS (sessions), newest first, paginated. Each
 * item groups the answers of one run (5/10 questions) into a single summary —
 * average score, verdict breakdown, dominant level — from the
 * `interview_attempts` log. Optionally scoped to a course or a single deck.
 */
@Resolver()
export class InterviewSessionsResolver {
    constructor(
        private readonly interviewHistoryService: InterviewHistoryService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Interview runs fetched successfully",
        [Locale.Vi]: "Lấy danh sách phiên phỏng vấn thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => InterviewSessionsResponse,
        {
            name: "interviewSessions",
            description: "The viewer's paginated mock-interview runs (optionally per course / deck).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("courseId",
            {
                type: () => ID,
                nullable: true,
                description: "Optional course to scope the runs to (random-interview mode = course-wide).",
            })
            courseId: string | null,
        @Args("flashcardDeckId",
            {
                type: () => ID,
                nullable: true,
                description: "Optional deck to scope the runs to (takes precedence over courseId).",
            })
            flashcardDeckId: string | null,
        @Args("limit",
            {
                type: () => Int,
                nullable: true,
                description: "Page size (sessions per page); defaults to 10, capped at 50.",
            })
            limit: number | null,
        @Args("offset",
            {
                type: () => Int,
                nullable: true,
                description: "Page offset (sessions to skip); defaults to 0.",
            })
            offset: number | null,
    ): Promise<InterviewSessionsData> {
        const safeLimit = Math.min(
            MAX_LIMIT,
            Math.max(1,
                limit ?? DEFAULT_LIMIT),
        )
        const safeOffset = Math.max(0,
            offset ?? 0)
        const page = await this.interviewHistoryService.getSessions({
            userId: user.id,
            flashcardDeckId,
            courseId,
            limit: safeLimit,
            offset: safeOffset,
        })
        // project to the GraphQL shape — serialize each run's start timestamp
        return {
            totalCount: page.totalCount,
            items: page.items.map((run) => ({
                sessionId: run.sessionId,
                startedAt: run.startedAt.toISOString(),
                questionCount: run.questionCount,
                averageScore: run.averageScore,
                bestScore: run.bestScore,
                passCount: run.passCount,
                borderlineCount: run.borderlineCount,
                failCount: run.failCount,
                level: run.level,
            })),
        }
    }
}
