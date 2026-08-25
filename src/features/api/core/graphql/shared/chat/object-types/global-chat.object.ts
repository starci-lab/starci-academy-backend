import {
    Field, ID, Int, ObjectType 
} from "@nestjs/graphql"

@ObjectType()
/** Aggregate reaction state safe to expose to an authenticated room participant. */
export class GlobalChatReactionObject {
  @Field(() => String) emoji: string
  @Field(() => Int) count: number
  @Field(() => Boolean) reactedByViewer: boolean
}

@ObjectType()
/** Actor-specific message projection; removed content and confidential reports stay absent. */
export class GlobalChatMessageObject {
  @Field(() => ID) id: string
  @Field(() => String,
      {
          nullable: true,
      })
      body: string | null
  @Field(() => ID) authorId: string
  @Field(() => String) authorName: string
  @Field(() => String,
      {
          nullable: true,
      })
      authorAvatar: string | null
  @Field(() => ID,
      {
          nullable: true,
      })
      replyToId: string | null
  @Field(() => Int) version: number
  @Field(() => Date,
      {
          nullable: true,
      })
      editedAt: Date | null
  @Field(() => Date,
      {
          nullable: true,
      })
      removedAt: Date | null
  @Field(() => String,
      {
          nullable: true,
      })
      removalState: string | null
  @Field(() => Date) createdAt: Date
  @Field(() => [GlobalChatReactionObject])
      reactions: Array<GlobalChatReactionObject>
  @Field(() => Boolean) mentionedViewer: boolean
  @Field(() => Boolean) isMine: boolean
}

@ObjectType()
/** Cursor page of canonical Global Chat history. */
export class GlobalChatMessagesPageObject {
  @Field(() => [GlobalChatMessageObject]) items: Array<GlobalChatMessageObject>
  @Field(() => String,
      {
          nullable: true,
      })
      nextCursor: string | null
}

@ObjectType()
/** Current actor's room access, unread and notification state. */
export class GlobalChatRoomObject {
  @Field(() => ID) conversationId: string
  @Field(() => String) accessState: string
  @Field(() => Boolean) canWrite: boolean
  @Field(() => Boolean) notificationsMuted: boolean
  @Field(() => Int) unreadCount: number
  @Field(() => Int) mentionCount: number
  @Field(() => ID,
      {
          nullable: true,
      })
      lastReadMessageId: string | null
}

@ObjectType()
/** Stable response envelope returned by an idempotent Global Chat command. */
export class GlobalChatCommandObject {
  @Field(() => String) commandId: string
  @Field(() => ID) conversationId: string
  @Field(() => ID,
      {
          nullable: true,
      })
      messageId?: string
  @Field(() => ID,
      {
          nullable: true,
      })
      reportId?: string
  @Field(() => ID,
      {
          nullable: true,
      })
      caseId?: string
  @Field(() => Int,
      {
          nullable: true,
      })
      version?: number
  @Field(() => Boolean,
      {
          nullable: true,
      })
      active?: boolean
  @Field(() => String,
      {
          nullable: true,
      })
      status?: string
}

@ObjectType()
/** Moderator-only report case with immutable evidence captured at report time. */
export class GlobalChatModerationCaseObject {
  @Field(() => ID) id: string
  @Field(() => ID) reportId: string
  @Field(() => ID,
      {
          nullable: true,
      })
      messageId: string | null
  @Field(() => ID,
      {
          nullable: true,
      })
      reportedUserId: string | null
  @Field(() => ID) reporterId: string
  @Field(() => String) category: string
  @Field(() => String,
      {
          nullable: true,
      })
      details: string | null
  @Field(() => String) status: string
  @Field(() => String,
      {
          nullable: true,
      })
      outcome: string | null
  @Field(() => String,
      {
          nullable: true,
      })
      reason: string | null
  @Field(() => Int) version: number
  @Field(() => String) evidenceJson: string
  @Field(() => Date) createdAt: Date
}

@ObjectType()
/** Bounded moderator queue response. */
export class GlobalChatModerationQueueObject {
  @Field(() => [GlobalChatModerationCaseObject])
      items: Array<GlobalChatModerationCaseObject>
}
