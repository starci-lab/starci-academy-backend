import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"
import {
    ChatConversationObject,
} from "../../../../shared/chat/object-types/chat-conversation.object"

@ObjectType({
    description: "Response wrapper for the communityChatConversation query.",
})
/** Response wrapper for the communityChatConversation query. */
export class CommunityChatConversationResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ChatConversationObject>
{
    /** The global community chat conversation handle. */
    @Field(
        () => ChatConversationObject,
        {
            nullable: true,
            description: "The global community chat conversation handle.",
        },
    )
        data: ChatConversationObject
}
