import {
    Args,
    Mutation,
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
    FlashcardDueReviewSessionService,
} from "@modules/bussiness/flashcard/flashcard-due-review-session.service"
import {
    GraphQLEnrollmentGuard,
} from "@modules/bussiness/guards/graphql-enrollment.guard"
import {
    CompleteFlashcardDueReviewSessionRequest,
} from "./graphql-types/request"
import {
    CompleteFlashcardDueReviewSessionData,
    CompleteFlashcardDueReviewSessionResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Record a finished cross-deck due-review batch session via
 * {@link FlashcardDueReviewSessionService}, snapshotting the final
 * reviewed-count/xpEarned onto the row. Grants NO XP server-side -- see
 * `CompleteFlashcardDueReviewSessionRequest`'s own doc. Mirrors
 * `CompleteFlashcardReviewSessionResolver`.
 */
export class CompleteFlashcardDueReviewSessionResolver {
    constructor(
        private readonly flashcardDueReviewSessionService: FlashcardDueReviewSessionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Due-review session recorded successfully",
        [Locale.Vi]: "Ghi nhận phiên ôn tập đến hạn thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => CompleteFlashcardDueReviewSessionResponse,
        {
            name: "completeFlashcardDueReviewSession",
            description: "Record a finished cross-deck due-review batch session (no server-side XP grant).",
        },
    )
    async execute(
        @Args("request")
            request: CompleteFlashcardDueReviewSessionRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<CompleteFlashcardDueReviewSessionData> {
        return this.flashcardDueReviewSessionService.complete({
            userId: user.id,
            sessionId: request.sessionId,
            reviewedCount: request.reviewedCount,
            xpEarned: request.xpEarned,
        })
    }
}
