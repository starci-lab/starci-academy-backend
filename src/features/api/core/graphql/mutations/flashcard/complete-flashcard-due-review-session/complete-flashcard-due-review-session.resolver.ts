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
    FlashcardDueReviewSessionService,
    GraphQLEnrollmentGuard,
} from "@modules/bussiness"
import {
    CompleteFlashcardDueReviewSessionData,
    CompleteFlashcardDueReviewSessionRequest,
    CompleteFlashcardDueReviewSessionResponse,
} from "./graphql-types"

/**
 * Record a finished cross-deck due-review batch session via
 * {@link FlashcardDueReviewSessionService}, snapshotting the final
 * reviewed-count/xpEarned onto the row. Grants NO XP server-side — see
 * `CompleteFlashcardDueReviewSessionRequest`'s own doc. Mirrors
 * `CompleteFlashcardReviewSessionResolver`.
 */
@Resolver()
export class CompleteFlashcardDueReviewSessionResolver {
    constructor(
        private readonly flashcardDueReviewSessionService: FlashcardDueReviewSessionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Due-review session recorded successfully",
        [Locale.Vi]: "Ghi nhận phiên ôn tập đến hạn thành công",
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
