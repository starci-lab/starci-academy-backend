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
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"
import {
    SyncMockInterviewSessionTurnsRequest,
    SyncMockInterviewSessionTurnsResponse,
} from "./graphql-types"
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
