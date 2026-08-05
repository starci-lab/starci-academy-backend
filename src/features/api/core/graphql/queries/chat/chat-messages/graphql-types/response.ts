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
    ChatMessagesPageObject,
} from "../../../../shared/chat/object-types/chat-messages-page.object"

@ObjectType({
    description: "Response wrapper for the chatMessages query.",
})
/** Response wrapper for the chatMessages query. */
export class ChatMessagesResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<ChatMessagesPageObject>
{
    /** A page of chat messages + next cursor. */
    @Field(
        () => ChatMessagesPageObject,
        {
            nullable: true,
            description: "A page of chat messages + next cursor.",
        },
    )
        data: ChatMessagesPageObject
}
