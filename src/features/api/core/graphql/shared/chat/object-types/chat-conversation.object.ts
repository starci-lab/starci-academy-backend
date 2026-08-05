import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    ChatConversationType,
    GraphQLTypeChatConversationType,
} from "@modules/databases"

@ObjectType({
    description: "A chat conversation (community room or founder DM).",
})
/** A chat conversation handle shaped for the client (id + kind). */
export class ChatConversationObject {
    /** Conversation primary id (pass to chatMessages / sendChatMessage). */
    @Field(
        () => ID,
        {
            description: "Conversation primary id.",
        },
    )
        id: string

    /** Kind of conversation (community room vs founder DM). */
    @Field(
        () => GraphQLTypeChatConversationType,
        {
            description: "Kind of conversation (community room vs founder DM).",
        },
    )
        type: ChatConversationType
}
