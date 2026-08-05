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
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    ChatConversationObject,
} from "../../../shared/chat"
import {
    MyFounderConversationResponse,
} from "./graphql-types"
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
