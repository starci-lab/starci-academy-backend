import {
    Field, ID, InputType 
} from "@nestjs/graphql"

@InputType({
    description: "Request to send a chat message to a conversation.",
})
/** Request to send a chat message to a conversation. */
export class SendChatMessageRequest {
  /** Stable identifier reused when the client retries a timed-out send. */
  @Field(() => String,
      {
          nullable: true,
          description: "Stable client command id for retry-safe sends.",
      })
      clientCommandId?: string

  /** Conversation the message is sent to. */
  @Field(() => ID,
      {
          description: "Conversation the message is sent to.",
      })
      conversationId: string

  /** Raw message body authored by the user. */
  @Field(() => String,
      {
          description: "Raw message body authored by the user.",
      })
      body: string
}
