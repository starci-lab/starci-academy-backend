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
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness/guards/graphql-must-enrolled.guard"
import {
    SyncMockInterviewSessionTurnsRequest,
} from "./graphql-types/request"
import {
    SyncMockInterviewSessionTurnsResponse,
} from "./graphql-types/response"
import {
    SyncMockInterviewSessionTurnsService,
} from "./sync-mock-interview-session-turns.service"

@Resolver()
/**
 * GraphQL entry for periodic transcript sync so a mid-interview navigate-away
 * can resume. Soft-fails stale ticks instead of error-toasting the learner.
 */
export class SyncMockInterviewSessionTurnsResolver {
    constructor(
        private readonly syncMockInterviewSessionTurnsService: SyncMockInterviewSessionTurnsService,
    ) { }

    /**
     * Periodically syncs an in-flight mock-interview session's transcript +
     * position so a learner who navigates away mid-session can resume it via
     * `myInProgressMockInterviewSession`. Never throws for a stale/late sync
     * (session already graded/abandoned) -- see the handler's own doc.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Mock interview session synced successfully",
        [Locale.Vi]: "Đồng bộ phiên phỏng vấn thử thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SyncMockInterviewSessionTurnsResponse,
        {
            name: "syncMockInterviewSessionTurns",
            description: "Syncs an in-flight mock-interview session's transcript + position for later resume.",
        },
    )
    async execute(
        @Args("request")
            request: SyncMockInterviewSessionTurnsRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.syncMockInterviewSessionTurnsService.execute(
            {
                request,
                user,
            },
        )
    }
}
