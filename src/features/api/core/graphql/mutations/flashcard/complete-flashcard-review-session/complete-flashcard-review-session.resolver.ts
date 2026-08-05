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
    FlashcardReviewSessionService,
    GraphQLEnrollmentGuard,
} from "@modules/bussiness"
import {
    CompleteFlashcardReviewSessionData,
    CompleteFlashcardReviewSessionRequest,
    CompleteFlashcardReviewSessionResponse,
} from "./graphql-types"

@Resolver()
/**
 * Record a finished flashcard review ("Học thẻ") session via
 * {@link FlashcardReviewSessionService}, snapshotting the final
 * reviewed-count/xpEarned onto the row. Grants NO XP server-side — see
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
        [Locale.Vi]: "Ghi nhận phiên ôn tập thành công",
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
