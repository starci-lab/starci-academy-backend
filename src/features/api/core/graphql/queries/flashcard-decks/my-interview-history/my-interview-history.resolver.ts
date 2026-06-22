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
    @UseGuards(KeycloakAuthGraphQLGuard)
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
        @Args("flashcardDeckId",
            {
                type: () => ID,
                nullable: true,
                description: "Optional deck to scope the history to.",
            })
            flashcardDeckId: string | null,
    ): Promise<MyInterviewHistoryData> {
        const summary = await this.interviewHistoryService.getSummary({
            userId: user.id,
            flashcardDeckId,
        })
        // project to the GraphQL shape — serialize the timestamp to an ISO string
        return {
            totalAnswered: summary.totalAnswered,
            averageScore: summary.averageScore,
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
