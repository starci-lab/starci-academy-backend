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
    InterviewHistoryService,
} from "@modules/bussiness"
import {
    MyInterviewHistoryData,
    MyInterviewHistoryResponse,
} from "./graphql-types"

/**
 * The viewer's cross-session mock-interview history — average score, verdict
 * breakdown, and weakest topics — aggregated from the `interview_attempts` log.
 * Optionally scoped to a single deck via `flashcardDeckId`.
 */
@Resolver()
export class MyInterviewHistoryResolver {
    constructor(
        private readonly interviewHistoryService: InterviewHistoryService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard, GraphQLMustEnrolledGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Interview history fetched successfully",
        [Locale.Vi]: "Lấy lịch sử phỏng vấn thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyInterviewHistoryResponse,
        {
            name: "myInterviewHistory",
            description: "The viewer's aggregated mock-interview history (optionally per deck).",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("courseId",
            {
                type: () => ID,
                nullable: true,
                description: "Optional course to scope the history to (random-interview mode = course-wide).",
            })
            courseId: string | null,
        @Args("flashcardDeckId",
            {
                type: () => ID,
                nullable: true,
                description: "Optional deck to scope the history to (takes precedence over courseId).",
            })
            flashcardDeckId: string | null,
    ): Promise<MyInterviewHistoryData> {
        const summary = await this.interviewHistoryService.getSummary({
            userId: user.id,
            flashcardDeckId,
            courseId,
        })
        // project to the GraphQL shape — serialize the timestamp to an ISO string
        return {
            totalAnswered: summary.totalAnswered,
            averageScore: summary.averageScore,
            bestScore: summary.bestScore,
            passCount: summary.passCount,
            borderlineCount: summary.borderlineCount,
            failCount: summary.failCount,
            weakTags: summary.weakTags,
            lastAttemptAt: summary.lastAttemptAt
                ? summary.lastAttemptAt.toISOString()
                : null,
        }
    }
}
