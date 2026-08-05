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
    FlashcardReviewSessionService,
} from "@modules/bussiness/flashcard/flashcard-review-session.service"
import {
    GraphQLEnrollmentGuard,
} from "@modules/bussiness/guards/graphql-enrollment.guard"
import {
    CompleteFlashcardReviewSessionRequest,
} from "./graphql-types/request"
import {
    CompleteFlashcardReviewSessionData,
    CompleteFlashcardReviewSessionResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Record a finished flashcard review session via
 * {@link FlashcardReviewSessionService}, snapshotting the final
 * reviewed-count/xpEarned onto the row. Grants NO XP server-side -- see
 * `CompleteFlashcardReviewSessionRequest`'s own doc.
 */
export class CompleteFlashcardReviewSessionResolver {
    constructor(
        private readonly flashcardReviewSessionService: FlashcardReviewSessionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Review session recorded successfully",
        [Locale.Vi]: "Ghi nhận phiên ôn tập thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => CompleteFlashcardReviewSessionResponse,
        {
            name: "completeFlashcardReviewSession",
            description: "Record a finished flashcard review session (no server-side XP grant).",
        },
    )
    async execute(
        @Args("request")
            request: CompleteFlashcardReviewSessionRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<CompleteFlashcardReviewSessionData> {
        return this.flashcardReviewSessionService.complete({
            userId: user.id,
            sessionId: request.sessionId,
            reviewedCount: request.reviewedCount,
            xpEarned: request.xpEarned,
        })
    }
}
