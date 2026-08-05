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
import {
    RenameContentAiSessionRequest,
    RenameContentAiSessionResponse,
} from "./graphql-types"
import type {
    RenameContentAiSessionData,
} from "./graphql-types"

@Resolver()
/** GraphQL entry that lets the user replace a generated sidebar title. */
export class RenameContentAiSessionResolver {
    constructor(
        private readonly contentAiService: ContentAiService,
    ) { }

    /**
     * Rename one of the current user's content-AI conversations. A blank title
     * resets it to auto-titling. Requires authentication.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Conversation renamed",
        [Locale.Vi]: "Đã đổi tên hội thoại",
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => RenameContentAiSessionResponse,
        {
            name: "renameContentAiSession",
            description: "Rename one of the current user's content-AI conversations.",
        },
    )
    async execute(
        @Args("request")
            request: RenameContentAiSessionRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<RenameContentAiSessionData> {
        await this.contentAiService.renameContentAiSession({
            userId: user.id,
            sessionId: request.sessionId,
            title: request.title,
        })
        return {
            renamed: true,
        }
    }
}
