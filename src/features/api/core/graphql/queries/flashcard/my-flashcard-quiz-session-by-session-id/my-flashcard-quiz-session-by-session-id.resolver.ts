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
    GraphQLEnrollmentGuard,
} from "@modules/bussiness/guards/graphql-enrollment.guard"
import {
    MyFlashcardQuizSessionBySessionIdService,
} from "./my-flashcard-quiz-session-by-session-id.service"
import {
    MyFlashcardQuizSessionBySessionIdData,
    MyFlashcardQuizSessionBySessionIdResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * The resolved recap for ONE flashcard quick-quiz session,
 * resolved by its id ALONE REGARDLESS of status. Powers the FE's post-quiz
 * result view: after a quiz completes (or when a completed/abandoned session
 * link is re-opened), `myInProgressFlashcardQuizSession` returns null (it is
 * `in_progress`-scoped), so a stale link would otherwise dead-end to a fresh
 * setup -- this recovers the session by id and returns its snapshotted recap
 * (mode/level/coverage/xp/per-card + weak-tag breakdown) instead. Owner-scoped
 * via the session's enrollment; resolves to `null` when the id is not found /
 * not owned by the caller.
 */
export class MyFlashcardQuizSessionBySessionIdResolver {
    constructor(
        private readonly myFlashcardQuizSessionBySessionIdService: MyFlashcardQuizSessionBySessionIdService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Flashcard quiz session fetched successfully",
        [Locale.Vi]: "Lấy phiên hỏi nhanh thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyFlashcardQuizSessionBySessionIdResponse,
        {
            name: "myFlashcardQuizSessionBySessionId",
            description: "The resolved recap (mode, level, coverage, xp, per-card + weak-tag breakdown) for one flashcard quiz session resolved by its id, or null when not found/not owned by the caller.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("sessionId",
            {
                type: () => ID,
                description: "Id of the quiz session to resolve.",
            })
            sessionId: string,
    ): Promise<MyFlashcardQuizSessionBySessionIdData | null> {
        const session = await this.myFlashcardQuizSessionBySessionIdService.find({
            userId: user.id,
            sessionId,
        })

        if (!session) {
            return null
        }

        return {
            sessionId: session.sessionId,
            status: session.status,
            mode: session.mode,
            level: session.level ?? undefined,
            coverage: session.coverage ?? undefined,
            xpEarned: session.xpEarned,
            cardCount: session.cardCount,
            answeredCount: session.answeredCount,
            fullyCorrectCount: session.fullyCorrectCount,
            durationSeconds: session.durationSeconds ?? undefined,
            weakTags: session.weakTags.map((weakTag) => ({
                tag: weakTag.tag,
                coverage: weakTag.coverage,
                moduleId: weakTag.moduleId ?? undefined,
                contentId: weakTag.contentId ?? undefined,
            })),
            results: session.results,
        }
    }
}
