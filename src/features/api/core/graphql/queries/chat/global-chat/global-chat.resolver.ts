import {
    UseGuards, UseInterceptors 
} from "@nestjs/common"
import {
    Args, Query, Resolver 
} from "@nestjs/graphql"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    UserEntity 
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale 
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    KeycloakAuthGraphQLGuard 
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser 
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    GlobalChatMessagesPageObject,
    GlobalChatModerationQueueObject,
    GlobalChatRoomObject,
} from "../../../shared/chat/object-types/global-chat.object"
import {
    GlobalChatMessagesRequest,
    GlobalChatModerationQueueRequest,
} from "./graphql-types/request"
import {
    GlobalChatMessagesResponse,
    GlobalChatModerationQueueResponse,
    GlobalChatRoomResponse,
} from "./graphql-types/response"
import {
    GlobalChatQueryService 
} from "./global-chat.service"

@Resolver()
@UseGuards(KeycloakAuthGraphQLGuard)
@UseInterceptors(GraphQLTransformInterceptor)
/** Actor-safe read boundary for the room, history and moderator queue projections. */
export class GlobalChatResolver {
    constructor(private readonly service: GlobalChatQueryService) {}

  @GraphQLSuccessMessage({
      [Locale.En]: "Global Chat opened",
      [Locale.Vi]: "Đã mở Global Chat", // vn-ok: localized Vietnamese response copy
  })
  @Query(() => GlobalChatRoomResponse,
      {
          name: "globalChatRoom",
      })
    room(@KeycloakGraphQLUser() user: UserEntity): Promise<GlobalChatRoomObject> {
        return this.service.room(user)
    }

  @GraphQLSuccessMessage({
      [Locale.En]: "Global Chat messages fetched",
      [Locale.Vi]: "Đã tải tin nhắn Global Chat", // vn-ok: localized Vietnamese response copy
  })
  @Query(() => GlobalChatMessagesResponse,
      {
          name: "globalChatMessages",
      })
  messages(
    @Args("request") request: GlobalChatMessagesRequest,
    @KeycloakGraphQLUser() user: UserEntity,
  ): Promise<GlobalChatMessagesPageObject> {
      return this.service.messages(user,
          request)
  }

  @GraphQLSuccessMessage({
      [Locale.En]: "Moderation queue fetched",
      [Locale.Vi]: "Đã tải hàng chờ kiểm duyệt", // vn-ok: localized Vietnamese response copy
  })
  @Query(() => GlobalChatModerationQueueResponse,
      {
          name: "globalChatModerationQueue",
      })
  moderationQueue(
    @Args("request") request: GlobalChatModerationQueueRequest,
    @KeycloakGraphQLUser() user: UserEntity,
  ): Promise<GlobalChatModerationQueueObject> {
      return this.service.moderationQueue(user,
          request)
  }
}
