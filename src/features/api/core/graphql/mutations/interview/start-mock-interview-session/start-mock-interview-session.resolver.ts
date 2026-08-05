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
    GraphQLLocale,
} from "@modules/api/apollo/server/decorators/locale.decorators"
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
    StartMockInterviewSessionRequest,
} from "./graphql-types/request"
import {
    StartMockInterviewSessionResponse,
} from "./graphql-types/response"
import {
    StartMockInterviewSessionService,
} from "./start-mock-interview-session.service"

@Resolver()
/**
 * GraphQL entry for opening a mock interview. Enrolment is required so the
 * draw only uses course-private prompts and flashcard seeds.
 */
export class StartMockInterviewSessionResolver {
    constructor(
        private readonly startMockInterviewSessionService: StartMockInterviewSessionService,
    ) { }

    /**
     * Draws ONE mock-interview session for a course + level + kind,
     * SERVER-SIDE -- the client never picks/sends which prompt (or, for the
     * Q&A kinds, which flashcard topics) was drawn, only asks for one.
     * Persists the draw so `gradeMockInterviewSession` can later grade against
     * the server-stored prompt/level/kind instead of trusting the client.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Mock interview session started successfully",
        [Locale.Vi]: "Bắt đầu phiên phỏng vấn thử thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => StartMockInterviewSessionResponse,
        {
            name: "startMockInterviewSession",
            description: "Server-draws one mock-interview session for a course + level + kind and persists it.",
        },
    )
    async execute(
        @Args("request")
            request: StartMockInterviewSessionRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.startMockInterviewSessionService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
