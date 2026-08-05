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
    SyncFlashcardReviewSessionProgressRequest,
} from "./graphql-types/request"
import {
    SyncFlashcardReviewSessionProgressResponse,
} from "./graphql-types/response"
import {
    SyncFlashcardReviewSessionProgressService,
} from "./sync-flashcard-review-session-progress.service"

@Resolver()
/**
 * GraphQL entrypoint for `syncFlashcardReviewSessionProgress` -- delegates to {@link SyncFlashcardReviewSessionProgressService.execute},
 * which dispatches the CQRS command {@link SyncFlashcardReviewSessionProgressHandler} owns. See {@link execute}'s
 * own doc below for what the mutation actually does.
 */
export class SyncFlashcardReviewSessionProgressResolver {
    constructor(
        private readonly syncFlashcardReviewSessionProgressService: SyncFlashcardReviewSessionProgressService,
    ) { }

    /**
     * Periodically syncs an in-flight flashcard review session's position +
     * progress so a learner who navigates away mid-review can resume it via
     * `myInProgressFlashcardReviewSession`. Never throws for a stale/late
     * sync (session already completed/abandoned) -- see the service's own
     * doc.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Flashcard review session synced successfully",
        [Locale.Vi]: "Đồng bộ phiên ôn tập thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SyncFlashcardReviewSessionProgressResponse,
        {
            name: "syncFlashcardReviewSessionProgress",
            description: "Syncs an in-flight flashcard review session's position + progress for later resume.",
        },
    )
    async execute(
        @Args("request")
            request: SyncFlashcardReviewSessionProgressRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.syncFlashcardReviewSessionProgressService.execute(
            {
                request,
                user,
            },
        )
    }
}
