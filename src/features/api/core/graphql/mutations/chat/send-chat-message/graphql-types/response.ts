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
    ChatMessageNodeObject,
} from "../../../../shared/chat/object-types/chat-message-node.object"

@ObjectType({
    description: "Response wrapper for the send-chat-message mutation.",
})
/** Response wrapper for the send-chat-message mutation. */
export class SendChatMessageResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ChatMessageNodeObject>
{
    /** The newly sent chat message node. */
    @Field(
        () => ChatMessageNodeObject,
        {
            nullable: true,
            description: "The newly sent chat message node.",
        },
    )
        data: ChatMessageNodeObject
}
