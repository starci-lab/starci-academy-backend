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
    FlashcardReviewService,
} from "@modules/bussiness/flashcard/flashcard-review.service"
import {
    GraphQLEnrollmentGuard,
} from "@modules/bussiness/guards/graphql-enrollment.guard"
import {
    ReviewFlashcardRequest,
} from "./graphql-types/request"
import {
    ReviewFlashcardData,
    ReviewFlashcardResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Grade one flashcard in the spaced-repetition flow. Applies SM-2 and upserts the
 * viewer's per-card review row via {@link FlashcardReviewService}, returning the
 * next due date.
 */
export class ReviewFlashcardResolver {
    constructor(
        private readonly flashcardReviewService: FlashcardReviewService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Flashcard reviewed successfully",
        [Locale.Vi]: "Ôn thẻ thành công", // vn-ok: vi-locale string emitted to clients
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
