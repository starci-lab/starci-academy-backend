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
    StartFlashcardDueReviewSessionRequest,
} from "./graphql-types/request"
import {
    StartFlashcardDueReviewSessionResponse,
} from "./graphql-types/response"
import {
    StartFlashcardDueReviewSessionService,
} from "./start-flashcard-due-review-session.service"

@Resolver()
/**
 * GraphQL entrypoint for `startFlashcardDueReviewSession` -- delegates to {@link StartFlashcardDueReviewSessionService.execute},
 * which dispatches the CQRS command {@link StartFlashcardDueReviewSessionHandler} owns. See {@link execute}'s
 * own doc below for what the mutation actually does.
 */
export class StartFlashcardDueReviewSessionResolver {
    constructor(
        private readonly startFlashcardDueReviewSessionService: StartFlashcardDueReviewSessionService,
    ) { }

    /**
     * Persists ONE cross-deck due-review batch session draw so it becomes
     * resumable -- mirrors `startFlashcardReviewSession`. Retires any PRIOR
     * "in_progress" draw for the same enrollment first, so a learner never
     * has two resumable due-review batches at once.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Flashcard due-review session started successfully",
        [Locale.Vi]: "Bắt đầu phiên ôn tập đến hạn thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => StartFlashcardDueReviewSessionResponse,
        {
            name: "startFlashcardDueReviewSession",
            description: "Persists a resumable cross-deck due-review batch session for a course + drawn card set.",
        },
    )
    async execute(
        @Args("request")
            request: StartFlashcardDueReviewSessionRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.startFlashcardDueReviewSessionService.execute(
            {
                request,
                user,
            },
        )
    }
}
