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
    GlobalChatCommandObject 
} from "../../../../shared/chat/object-types/global-chat.object"

@ObjectType()
/** GraphQL success wrapper for canonical Global Chat command results. */
export class GlobalChatCommandResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<GlobalChatCommandObject>
{
  @Field(() => GlobalChatCommandObject,
      {
          nullable: true,
      })
      data: GlobalChatCommandObject
}
