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
    FlashcardQuizSessionService,
    GraphQLEnrollmentGuard,
} from "@modules/bussiness"
import {
    CompleteFlashcardQuizSessionData,
    CompleteFlashcardQuizSessionRequest,
    CompleteFlashcardQuizSessionResponse,
} from "./graphql-types"

/**
 * Record a finished flashcard quick-quiz ("Hỏi nhanh") session and grant its
 * capped, idempotent XP reward via {@link FlashcardQuizSessionService}, returning
 * the XP earned.
 */
@Resolver()
export class CompleteFlashcardQuizSessionResolver {
    constructor(
        private readonly flashcardQuizSessionService: FlashcardQuizSessionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Quiz session recorded successfully",
        [Locale.Vi]: "Ghi nhận phiên luyện thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => CompleteFlashcardQuizSessionResponse,
        {
            name: "completeFlashcardQuizSession",
            description: "Record a finished flashcard quick-quiz session and grant its XP.",
        },
    )
    async execute(
        @Args("request")
            request: CompleteFlashcardQuizSessionRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<CompleteFlashcardQuizSessionData> {
        // the service re-derives coverage from the per-card answers (never trusting
        // a client-sent aggregate), clamps inputs, computes the daily-capped reward,
        // and writes the single idempotent xp_histories row in one transaction
        return this.flashcardQuizSessionService.complete({
            userId: user.id,
            sessionId: request.sessionId,
            courseId: request.courseId,
            answers: request.answers,
        })
    }
}
