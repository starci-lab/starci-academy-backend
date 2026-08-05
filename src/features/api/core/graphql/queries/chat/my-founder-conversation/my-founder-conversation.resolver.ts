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
    ChatConversationObject,
} from "../../../shared/chat/object-types/chat-conversation.object"
import {
    MyFounderConversationResponse,
} from "./graphql-types/response"
import {
    MyFounderConversationService,
} from "./my-founder-conversation.service"

@Resolver()
/** GraphQL resolver for the `myFounderConversation` query. */
export class MyFounderConversationResolver {
    constructor(
        private readonly myFounderConversationService: MyFounderConversationService,
    ) {}

    /**
     * Returns the viewer's private founder DM conversation handle (created on first open).
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Founder chat fetched successfully",
        [Locale.Vi]: "Lấy phòng chat founder thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyFounderConversationResponse,
        {
            name: "myFounderConversation",
            description: "The viewer's private founder DM conversation handle.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<ChatConversationObject> {
        return this.myFounderConversationService.execute(user)
    }
}
