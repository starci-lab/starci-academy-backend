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
    ContentAiService,
} from "@modules/bussiness"
import type {
    ContentAiScope,
} from "@modules/bussiness"
import {
    CreateContentAiSessionRequest,
    CreateContentAiSessionResponse,
} from "./graphql-types"
import type {
    CreateContentAiSessionData,
} from "./graphql-types"

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
