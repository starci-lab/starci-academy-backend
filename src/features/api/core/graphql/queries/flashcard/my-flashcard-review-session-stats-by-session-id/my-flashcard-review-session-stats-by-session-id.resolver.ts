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
    MyFlashcardReviewSessionStatsBySessionIdService,
} from "./my-flashcard-review-session-stats-by-session-id.service"
import {
    MyFlashcardReviewSessionStatsBySessionIdData,
    MyFlashcardReviewSessionStatsBySessionIdResponse,
} from "./graphql-types"

@Resolver()
/**
 * Computed recap for ONE flashcard review session, resolved by its id ALONE
 * (whichever kind -- single-deck review review or the cross-deck due-review
 * batch) REGARDLESS of status. Powers the FE's post-session stats view: after
 * a session completes (or when a stale/completed session link is opened),
 * `myInProgressFlashcardReviewSession`/`...DueReviewSession` return null (they
 * are `in_progress`-scoped) -- this recovers the session by id and returns its
 * per-grade breakdown, weak-tags, duration, xp, and next-due instead of a dead
 * end. Owner-scoped via the session's enrollment; resolves to `null` when the
 * id is not found / not owned by the caller. Degrades gracefully for legacy
 * sessions whose events predate `sessionId` (count-only recap, never an error).
 */
export class MyFlashcardReviewSessionStatsBySessionIdResolver {
    constructor(
        private readonly myFlashcardReviewSessionStatsBySessionIdService: MyFlashcardReviewSessionStatsBySessionIdService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Flashcard session stats fetched successfully",
        [Locale.Vi]: "Lấy thống kê phiên ôn thẻ thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyFlashcardReviewSessionStatsBySessionIdResponse,
        {
            name: "myFlashcardReviewSessionStatsBySessionId",
            description: "The computed recap (per-grade breakdown, weak-tags, duration, xp, next due) for one flashcard review session resolved by its id, or null when not found/not owned by the caller.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("sessionId",
            {
                type: () => ID,
                description: "Id of the review session to resolve + aggregate.",
            })
            sessionId: string,
    ): Promise<MyFlashcardReviewSessionStatsBySessionIdData | null> {
        const stats = await this.myFlashcardReviewSessionStatsBySessionIdService.find({
            userId: user.id,
            sessionId,
        })

        if (!stats) {
            return null
        }

        return {
            sessionId: stats.sessionId,
            status: stats.status,
            reviewedCount: stats.reviewedCount,
            gradeCounts: stats.gradeCounts,
            durationSeconds: stats.durationSeconds ?? undefined,
            xpEarned: stats.xpEarned,
            nextDueAt: stats.nextDueAt?.toISOString() ?? undefined,
            weakTags: stats.weakTags,
        }
    }
}
