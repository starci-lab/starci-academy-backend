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
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    ChatConversationObject,
} from "../../../shared/chat"
import {
    CommunityChatConversationResponse,
} from "./graphql-types"
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
        [Locale.Vi]: "Lấy phòng chat cộng đồng thành công",
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
