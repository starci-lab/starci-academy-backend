import {
    Query,
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
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    ChatConversationObject,
} from "../../../shared/chat/object-types/chat-conversation.object"
import {
    CommunityChatConversationResponse,
} from "./graphql-types/response"
import {
    CommunityChatConversationService,
} from "./community-chat-conversation.service"

@Resolver()
/** GraphQL resolver for the `communityChatConversation` query. */
export class CommunityChatConversationResolver {
    constructor(
        private readonly communityChatConversationService: CommunityChatConversationService,
    ) {}

    /**
     * Returns the global community chat conversation handle (created on first access).
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Community chat fetched successfully",
        [Locale.Vi]: "Lấy phòng chat cộng đồng thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => CommunityChatConversationResponse,
        {
            name: "communityChatConversation",
            description: "The global community chat conversation handle.",
        },
    )
    async execute(): Promise<ChatConversationObject> {
        return this.communityChatConversationService.execute()
    }
}
