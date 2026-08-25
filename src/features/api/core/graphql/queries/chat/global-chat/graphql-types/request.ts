import {
    Field, InputType, Int 
} from "@nestjs/graphql"

@InputType()
/** Stable cursor and bounded page-size input for Global Chat history. */
export class GlobalChatMessagesRequest {
  @Field(() => String,
      {
          nullable: true,
      })
      cursor?: string
  @Field(() => Int,
      {
          nullable: true,
          defaultValue: 30,
      })
      limit?: number
}

@InputType()
/** Moderator-only queue filter and bounded page-size input. */
export class GlobalChatModerationQueueRequest {
  @Field(() => String,
      {
          nullable: true,
      })
      status?: string
  @Field(() => Int,
      {
          nullable: true,
          defaultValue: 50,
      })
      limit?: number
}
