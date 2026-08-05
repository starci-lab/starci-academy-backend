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
    FlashcardQuizSessionService,
} from "@modules/bussiness/flashcard/flashcard-quiz-session.service"
import {
    GraphQLEnrollmentGuard,
} from "@modules/bussiness/guards/graphql-enrollment.guard"
import {
    CompleteFlashcardQuizSessionRequest,
} from "./graphql-types/request"
import {
    CompleteFlashcardQuizSessionData,
    CompleteFlashcardQuizSessionResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Record a finished flashcard quick-quiz session and grant its
 * capped, idempotent XP reward via {@link FlashcardQuizSessionService}, returning
 * the XP earned.
 */
export class CompleteFlashcardQuizSessionResolver {
    constructor(
        private readonly flashcardQuizSessionService: FlashcardQuizSessionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Quiz session recorded successfully",
        [Locale.Vi]: "Ghi nhận phiên luyện thành công", // vn-ok: vi-locale string emitted to clients
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
