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

/** Response wrapper for the myFounderConversation query. */
@ObjectType({
    description: "Response wrapper for the myFounderConversation query.",
})
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
