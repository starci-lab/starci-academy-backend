import {
    UseGuards, UseInterceptors 
} from "@nestjs/common"
import {
    Args, Mutation, Resolver 
} from "@nestjs/graphql"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    GraphQLAdminAccessGuard 
} from "@modules/bussiness/guards/graphql-admin-access.guard"
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
    GlobalChatCommandObject 
} from "../../../shared/chat/object-types/global-chat.object"
import {
    EditGlobalChatMessageRequest,
    MarkGlobalChatReadRequest,
    ModerateGlobalChatRequest,
    ReactGlobalChatMessageRequest,
    RemoveGlobalChatMessageRequest,
    ReportGlobalChatRequest,
    SendGlobalChatMessageRequest,
    SetGlobalChatNotificationsRequest,
    SetGlobalChatRoleRequest,
} from "./graphql-types/request"
import {
    GlobalChatCommandResponse 
} from "./graphql-types/response"
import {
    GlobalChatMutationService 
} from "./global-chat.service"

@Resolver()
@UseGuards(KeycloakAuthGraphQLGuard)
@UseInterceptors(GraphQLTransformInterceptor)
/** Authenticated command boundary for member chat actions and protected moderation. */
export class GlobalChatMutationResolver {
    constructor(private readonly service: GlobalChatMutationService) {}

  @GraphQLSuccessMessage({
      [Locale.En]: "Message sent",
      [Locale.Vi]: "Đã gửi tin nhắn", // vn-ok: localized Vietnamese response copy
  })
  @Mutation(() => GlobalChatCommandResponse,
      {
          name: "sendGlobalChatMessage",
      })
    send(
    @Args("request") request: SendGlobalChatMessageRequest,
    @KeycloakGraphQLUser() user: UserEntity,
    ): Promise<GlobalChatCommandObject> {
        return this.service.send(user,
            request)
    }

  @GraphQLSuccessMessage({
      [Locale.En]: "Reaction updated",
      [Locale.Vi]: "Đã cập nhật cảm xúc", // vn-ok: localized Vietnamese response copy
  })
  @Mutation(() => GlobalChatCommandResponse,
      {
          name: "reactGlobalChatMessage",
      })
  react(
    @Args("request") request: ReactGlobalChatMessageRequest,
    @KeycloakGraphQLUser() user: UserEntity,
  ): Promise<GlobalChatCommandObject> {
      return this.service.react(user,
          request)
  }

  @GraphQLSuccessMessage({
      [Locale.En]: "Message edited",
      [Locale.Vi]: "Đã sửa tin nhắn", // vn-ok: localized Vietnamese response copy
  })
  @Mutation(() => GlobalChatCommandResponse,
      {
          name: "editGlobalChatMessage",
      })
  edit(
    @Args("request") request: EditGlobalChatMessageRequest,
    @KeycloakGraphQLUser() user: UserEntity,
  ): Promise<GlobalChatCommandObject> {
      return this.service.edit(user,
          request)
  }

  @GraphQLSuccessMessage({
      [Locale.En]: "Message removed",
      [Locale.Vi]: "Đã gỡ tin nhắn", // vn-ok: localized Vietnamese response copy
  })
  @Mutation(() => GlobalChatCommandResponse,
      {
          name: "removeGlobalChatMessage",
      })
  remove(
    @Args("request") request: RemoveGlobalChatMessageRequest,
    @KeycloakGraphQLUser() user: UserEntity,
  ): Promise<GlobalChatCommandObject> {
      return this.service.remove(user,
          request)
  }

  @GraphQLSuccessMessage({
      [Locale.En]: "Read position updated",
      [Locale.Vi]: "Đã cập nhật vị trí đọc", // vn-ok: localized Vietnamese response copy
  })
  @Mutation(() => GlobalChatCommandResponse,
      {
          name: "markGlobalChatRead",
      })
  markRead(
    @Args("request") request: MarkGlobalChatReadRequest,
    @KeycloakGraphQLUser() user: UserEntity,
  ): Promise<GlobalChatCommandObject> {
      return this.service.markRead(user,
          request)
  }

  @GraphQLSuccessMessage({
      [Locale.En]: "Report received",
      [Locale.Vi]: "Đã nhận báo cáo", // vn-ok: localized Vietnamese response copy
  })
  @Mutation(() => GlobalChatCommandResponse,
      {
          name: "reportGlobalChat",
      })
  report(
    @Args("request") request: ReportGlobalChatRequest,
    @KeycloakGraphQLUser() user: UserEntity,
  ): Promise<GlobalChatCommandObject> {
      return this.service.report(user,
          request)
  }

  @GraphQLSuccessMessage({
      [Locale.En]: "Moderation decision recorded",
      [Locale.Vi]: "Đã ghi nhận quyết định kiểm duyệt", // vn-ok: localized Vietnamese response copy
  })
  @Mutation(() => GlobalChatCommandResponse,
      {
          name: "moderateGlobalChat",
      })
  moderate(
    @Args("request") request: ModerateGlobalChatRequest,
    @KeycloakGraphQLUser() user: UserEntity,
  ): Promise<GlobalChatCommandObject> {
      return this.service.moderate(user,
          request)
  }

  @UseGuards(GraphQLAdminAccessGuard)
  @GraphQLSuccessMessage({
      [Locale.En]: "Global Chat role updated",
      [Locale.Vi]: "Đã cập nhật vai trò Global Chat", // vn-ok: localized Vietnamese response copy
  })
  @Mutation(() => GlobalChatCommandResponse,
      {
          name: "setGlobalChatRole",
      })
  setRole(
    @Args("request") request: SetGlobalChatRoleRequest,
    @KeycloakGraphQLUser() user: UserEntity,
  ): Promise<GlobalChatCommandObject> {
      return this.service.setRole(user,
          request)
  }

  @GraphQLSuccessMessage({
      [Locale.En]: "Notification preference updated",
      [Locale.Vi]: "Đã cập nhật thông báo", // vn-ok: localized Vietnamese response copy
  })
  @Mutation(() => GlobalChatCommandResponse,
      {
          name: "setGlobalChatNotifications",
      })
  notifications(
    @Args("request") request: SetGlobalChatNotificationsRequest,
    @KeycloakGraphQLUser() user: UserEntity,
  ): Promise<GlobalChatCommandObject> {
      return this.service.notifications(user,
          request)
  }
}
