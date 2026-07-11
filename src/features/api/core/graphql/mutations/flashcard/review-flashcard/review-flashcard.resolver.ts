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
    FlashcardReviewService,
    GraphQLEnrollmentGuard,
} from "@modules/bussiness"
import {
    ReviewFlashcardData,
    ReviewFlashcardRequest,
    ReviewFlashcardResponse,
} from "./graphql-types"

/**
 * Grade one flashcard in the spaced-repetition flow. Applies SM-2 and upserts the
 * viewer's per-card review row via {@link FlashcardReviewService}, returning the
 * next due date.
 */
@Resolver()
export class ReviewFlashcardResolver {
    constructor(
        private readonly flashcardReviewService: FlashcardReviewService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Flashcard reviewed successfully",
        [Locale.Vi]: "Ôn thẻ thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => ReviewFlashcardResponse,
        {
            name: "reviewFlashcard",
            description: "Grade a flashcard (SM-2) and schedule its next review.",
        },
    )
    async execute(
        @Args("request")
            request: ReviewFlashcardRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<ReviewFlashcardData> {
        // the service applies SM-2 + upserts the review row in one txn, threads the
        // session id onto the review-event log, and grants first-review XP
        return this.flashcardReviewService.review({
            userId: user.id,
            cardId: request.cardId,
            grade: request.grade,
            sessionId: request.sessionId,
        })
    }
}
