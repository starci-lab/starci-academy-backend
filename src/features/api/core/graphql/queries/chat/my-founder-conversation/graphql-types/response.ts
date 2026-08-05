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
    description: "Response wrapper for the myFounderConversation query.",
})
/** Response wrapper for the myFounderConversation query. */
export class MyFounderConversationResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ChatConversationObject>
{
    /** The viewer's private founder DM conversation handle. */
    @Field(
        () => ChatConversationObject,
        {
            nullable: true,
            description: "The viewer's private founder DM conversation handle.",
        },
    )
        data: ChatConversationObject
}
