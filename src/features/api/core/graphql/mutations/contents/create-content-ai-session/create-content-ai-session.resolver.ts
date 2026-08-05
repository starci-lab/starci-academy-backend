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
    ContentAiService,
} from "@modules/bussiness/content-ai/content-ai.service"
import type {
    ContentAiScope,
} from "@modules/bussiness/content-ai/types/session"
import {
    CreateContentAiSessionRequest,
} from "./graphql-types/request"
import {
    CreateContentAiSessionResponse,
} from "./graphql-types/response"
import type {
    CreateContentAiSessionData,
} from "./graphql-types/response"

@Resolver()
/** GraphQL entry that starts a conversation anchored to a content so later asks share that thread. */
export class CreateContentAiSessionResolver {
    constructor(
        private readonly contentAiService: ContentAiService,
    ) { }

    /**
     * Start a new content-AI conversation (session) anchored to a content.
     * Requires authentication.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Conversation started successfully",
        [Locale.Vi]: "Đã tạo hội thoại mới", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => CreateContentAiSessionResponse,
        {
            name: "createContentAiSession",
            description: "Start a new content-AI conversation for a content.",
        },
    )
    async execute(
        @Args("request")
            request: CreateContentAiSessionRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<CreateContentAiSessionData> {
        const id = await this.contentAiService.createSession({
            userId: user.id,
            scope: request.scope as ContentAiScope | undefined,
            contentId: request.contentId,
            taskId: request.taskId,
            challengeId: request.challengeId,
            quizId: request.quizId,
            foundationId: request.foundationId,
            courseId: request.courseId,
            archived: request.archived,
        })
        return {
            id,
        }
    }
}
