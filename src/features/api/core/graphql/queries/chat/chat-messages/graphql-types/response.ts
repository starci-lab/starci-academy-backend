import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    ChatMessagesPageObject,
} from "../../../../shared/chat"

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
