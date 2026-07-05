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
    StartMockInterviewSessionRequest,
    StartMockInterviewSessionResponse,
} from "./graphql-types"
import {
    StartMockInterviewSessionService,
} from "./start-mock-interview-session.service"

@Resolver()
export class StartMockInterviewSessionResolver {
    constructor(
        private readonly startMockInterviewSessionService: StartMockInterviewSessionService,
    ) { }

    /**
     * Draws ONE mock-interview session for a course + level + kind,
     * SERVER-SIDE — the client never picks/sends which prompt (or, for the
     * Q&A kinds, which flashcard topics) was drawn, only asks for one.
     * Persists the draw so `gradeMockInterviewSession` can later grade against
     * the server-stored prompt/level/kind instead of trusting the client.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Mock interview session started successfully",
        [Locale.Vi]: "Bắt đầu phiên phỏng vấn thử thành công",
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
