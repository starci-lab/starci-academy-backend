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
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    GraphQLEnrollmentGuard,
} from "@modules/bussiness/guards/graphql-enrollment.guard"
import {
    StartFlashcardQuizSessionRequest,
} from "./graphql-types/request"
import {
    StartFlashcardQuizSessionResponse,
} from "./graphql-types/response"
import {
    StartFlashcardQuizSessionService,
} from "./start-flashcard-quiz-session.service"

@Resolver()
/**
 * GraphQL entrypoint for `startFlashcardQuizSession` -- delegates to {@link StartFlashcardQuizSessionService.execute},
 * which dispatches the CQRS command {@link StartFlashcardQuizSessionHandler} owns. See {@link execute}'s
 * own doc below for what the mutation actually does.
 */
export class StartFlashcardQuizSessionResolver {
    constructor(
        private readonly startFlashcardQuizSessionService: StartFlashcardQuizSessionService,
    ) { }

    /**
     * Persists ONE flashcard quick-quiz session draw so it becomes resumable --
     * "resume flashcard quiz session" (2026-07-08). Retires any PRIOR
     * "in_progress" draw for the same enrollment first, so a learner never has
     * two resumable sessions at once, mirroring `startMockInterviewSession`.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Flashcard quiz session started successfully",
        [Locale.Vi]: "Bắt đầu phiên hỏi nhanh thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => StartFlashcardQuizSessionResponse,
        {
            name: "startFlashcardQuizSession",
            description: "Persists a resumable flashcard quick-quiz session for a course + drawn card set.",
        },
    )
    async execute(
        @Args("request")
            request: StartFlashcardQuizSessionRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.startFlashcardQuizSessionService.execute(
            {
                request,
                user,
            },
        )
    }
}
