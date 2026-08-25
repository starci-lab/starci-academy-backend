import {
    Field, ID, InputType, Int 
} from "@nestjs/graphql"

class GlobalChatCommandRequest {
  @Field(() => String) clientCommandId: string
}

@InputType()
/** Idempotent command to publish a new room message with optional reply and mentions. */
export class SendGlobalChatMessageRequest extends GlobalChatCommandRequest {
  @Field(() => String) body: string
  @Field(() => ID,
      {
          nullable: true,
      })
      replyToId?: string
  @Field(() => [ID],
      {
          nullable: true,
      })
      mentionUserIds?: Array<string>
}

@InputType()
/** Idempotent command to toggle one actor reaction on one message. */
export class ReactGlobalChatMessageRequest extends GlobalChatCommandRequest {
  @Field(() => ID) messageId: string
  @Field(() => String) emoji: string
}

@InputType()
/** Version-checked author command to edit message content. */
export class EditGlobalChatMessageRequest extends GlobalChatCommandRequest {
  @Field(() => ID) messageId: string
  @Field(() => String) body: string
  @Field(() => Int) expectedVersion: number
}

@InputType()
/** Version-checked author command to remove a message. */
export class RemoveGlobalChatMessageRequest extends GlobalChatCommandRequest {
  @Field(() => ID) messageId: string
  @Field(() => Int) expectedVersion: number
}

@InputType()
/** Monotonic command to advance the actor's room read anchor. */
export class MarkGlobalChatReadRequest extends GlobalChatCommandRequest {
  @Field(() => ID) messageId: string
}

@InputType()
/** Confidential report command for a message or room participant. */
export class ReportGlobalChatRequest extends GlobalChatCommandRequest {
  @Field(() => ID,
      {
          nullable: true,
      })
      messageId?: string
  @Field(() => ID,
      {
          nullable: true,
      })
      reportedUserId?: string
  @Field(() => String) category: string
  @Field(() => String,
      {
          nullable: true,
      })
      details?: string
}

@InputType()
/** Version-checked moderator decision with mandatory reason. */
export class ModerateGlobalChatRequest extends GlobalChatCommandRequest {
  @Field(() => ID) caseId: string
  @Field(() => String) action: string
  @Field(() => String) reason: string
  @Field(() => Int) expectedVersion: number
  @Field(() => Date,
      {
          nullable: true,
      })
      mutedUntil?: Date
}

@InputType()
/** Admin-only command to assign a Global Chat participation role. */
export class SetGlobalChatRoleRequest extends GlobalChatCommandRequest {
  @Field(() => ID) targetUserId: string
  @Field(() => String) role: "member" | "moderator" | "admin"
}

@InputType()
/** Idempotent command to change the actor's in-app chat notification preference. */
export class SetGlobalChatNotificationsRequest extends GlobalChatCommandRequest {
  @Field(() => Boolean) muted: boolean
}
