import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    ChatConversationObject,
} from "../../../../shared/chat"

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
