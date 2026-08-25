import {
    Field, ObjectType 
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse 
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import type {
    IAbstractGraphQLResponse 
} from "@modules/api/apollo/server/types/graphql-response"
import {
    GlobalChatMessagesPageObject,
    GlobalChatModerationQueueObject,
    GlobalChatRoomObject,
} from "../../../../shared/chat/object-types/global-chat.object"

@ObjectType()
/** GraphQL success wrapper for actor-specific room state. */
export class GlobalChatRoomResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<GlobalChatRoomObject>
{
  @Field(() => GlobalChatRoomObject,
      {
          nullable: true,
      })
      data: GlobalChatRoomObject
}

@ObjectType()
/** GraphQL success wrapper for a cursor page of actor-safe messages. */
export class GlobalChatMessagesResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<GlobalChatMessagesPageObject>
{
  @Field(() => GlobalChatMessagesPageObject,
      {
          nullable: true,
      })
      data: GlobalChatMessagesPageObject
}

@ObjectType()
/** GraphQL success wrapper for confidential moderator queue cases. */
export class GlobalChatModerationQueueResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<GlobalChatModerationQueueObject>
{
  @Field(() => GlobalChatModerationQueueObject,
      {
          nullable: true,
      })
      data: GlobalChatModerationQueueObject
}
