import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    ChatMessageNodeObject,
} from "../../../../shared/chat"

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
