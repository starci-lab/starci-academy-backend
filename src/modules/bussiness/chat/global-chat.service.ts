import {
    HttpStatus, Injectable 
} from "@nestjs/common"
import {
    In, MoreThan, type EntityManager 
} from "typeorm"
import {
    AbstractException 
} from "@modules/platform/exceptions/errors/abstract"
import {
    ChatCommandReceiptEntity 
} from "@modules/databases/postgresql/primary/entities/chat-command-receipt.entity"
import {
    ChatConversationEntity 
} from "@modules/databases/postgresql/primary/entities/chat-conversation.entity"
import {
    ChatMessageMentionEntity 
} from "@modules/databases/postgresql/primary/entities/chat-message-mention.entity"
import {
    ChatMessageReactionEntity 
} from "@modules/databases/postgresql/primary/entities/chat-message-reaction.entity"
import {
    ChatMessageEntity 
} from "@modules/databases/postgresql/primary/entities/chat-message.entity"
import {
    ChatModerationAuditEntity 
} from "@modules/databases/postgresql/primary/entities/chat-moderation-audit.entity"
import {
    ChatModerationCaseEntity 
} from "@modules/databases/postgresql/primary/entities/chat-moderation-case.entity"
import {
    ChatOutboxEntity 
} from "@modules/databases/postgresql/primary/entities/chat-outbox.entity"
import {
    ChatParticipationEntity 
} from "@modules/databases/postgresql/primary/entities/chat-participation.entity"
import {
    ChatReadStateEntity 
} from "@modules/databases/postgresql/primary/entities/chat-read-state.entity"
import {
    ChatReportEntity 
} from "@modules/databases/postgresql/primary/entities/chat-report.entity"
import {
    UserEntity 
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    ChatConversationType 
} from "@modules/databases/postgresql/primary/enums/chat-conversation-type"
import {
    InjectPrimaryPostgreSQLEntityManager 
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    GlobalChatMetricsService 
} from "./global-chat-metrics.service"
import {
    GlobalChatPolicyService 
} from "./global-chat-policy.service"

const GLOBAL_ROOM_KEY = "academy-global"
const MAX_BODY_LENGTH = 4000
const MAX_PAGE_SIZE = 50

function invalidGlobalChatRequest(
    message: string,
    code: string,
    metadata: Record<string, unknown> = {
    },
): AbstractException {
    return new AbstractException(message,
        code,
        metadata,
        HttpStatus.BAD_REQUEST)
}

function missingGlobalChatResource(
    message: string,
    code: string,
    metadata: Record<string, unknown> = {
    },
): AbstractException {
    return new AbstractException(message,
        code,
        metadata,
        HttpStatus.NOT_FOUND)
}

function conflictingGlobalChatCommand(
    message: string,
    code: string,
    metadata: Record<string, unknown> = {
    },
): AbstractException {
    return new AbstractException(message,
        code,
        metadata,
        HttpStatus.CONFLICT)
}

/** One aggregate reaction rendered for an actor-specific Global Chat message. */
export interface GlobalChatReactionProjection {
  emoji: string;
  count: number;
  reactedByViewer: boolean;
}

/** Actor-safe message state returned by the canonical history query. */
export interface GlobalChatMessageProjection {
  id: string;
  body: string | null;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  replyToId: string | null;
  version: number;
  editedAt: Date | null;
  removedAt: Date | null;
  removalState: string | null;
  createdAt: Date;
  reactions: Array<GlobalChatReactionProjection>;
  mentionedViewer: boolean;
  isMine: boolean;
}

/** Stable cursor page used to traverse Global Chat history. */
export interface GlobalChatPageProjection {
  items: Array<GlobalChatMessageProjection>;
  nextCursor: string | null;
}

/** Actor-specific room access, notification and unread state. */
export interface GlobalChatRoomProjection {
  conversationId: string;
  accessState: string;
  canWrite: boolean;
  notificationsMuted: boolean;
  unreadCount: number;
  mentionCount: number;
  lastReadMessageId: string | null;
}

/** Durable result returned by every idempotent Global Chat command. */
export interface GlobalChatCommandResult {
  commandId: string;
  conversationId: string;
  messageId?: string;
  reportId?: string;
  caseId?: string;
  version?: number;
  active?: boolean;
  status?: string;
}

/** Confidential moderator-only projection of a report case and captured evidence. */
export interface GlobalChatModerationCaseProjection {
  id: string;
  reportId: string;
  messageId: string | null;
  reportedUserId: string | null;
  reporterId: string;
  category: string;
  details: string | null;
  status: string;
  outcome: string | null;
  reason: string | null;
  version: number;
  evidence: Record<string, unknown>;
  createdAt: Date;
}

@Injectable()
/** Canonical Global Chat commands, actor-specific queries and moderation workflow. */
export class GlobalChatService {
    constructor(
    @InjectPrimaryPostgreSQLEntityManager()
    private readonly entityManager: EntityManager,
    private readonly policy: GlobalChatPolicyService,
    private readonly metrics: GlobalChatMetricsService,
    ) {}

    async getOrCreateRoom(
        entityManager: EntityManager = this.entityManager,
    ): Promise<ChatConversationEntity> {
        await entityManager
            .createQueryBuilder()
            .insert()
            .into(ChatConversationEntity)
            .values({
                type: ChatConversationType.Community,
                member: null,
                roomKey: GLOBAL_ROOM_KEY,
            })
            .orIgnore()
            .execute()
        const room = await entityManager.findOne(ChatConversationEntity,
            {
                where: {
                    roomKey: GLOBAL_ROOM_KEY,
                },
            })
        if (!room) {
            throw missingGlobalChatResource(
                "Global Chat room could not be initialized",
                "GLOBAL_CHAT_ROOM_NOT_FOUND",
            )
        }
        return room
    }

    async roomState(user: UserEntity): Promise<GlobalChatRoomProjection> {
        const room = await this.getOrCreateRoom()
        const participation = await this.policy.assertCanRead({
            conversationId: room.id,
            user,
        })
        const readState = await this.entityManager.findOne(ChatReadStateEntity,
            {
                where: {
                    conversation: {
                        id: room.id,
                    },
                    user: {
                        id: user.id,
                    },
                },
            })
        const after = readState?.lastReadAt ?? new Date(0)
        const unreadCount = await this.entityManager.count(ChatMessageEntity,
            {
                where: {
                    conversation: {
                        id: room.id,
                    },
                    createdAt: MoreThan(after),
                },
            })
        const mentionCount = await this.entityManager
            .createQueryBuilder(ChatMessageMentionEntity,
                "mention")
            .innerJoin("mention.message",
                "message")
            .where("mention.user_id = :userId",
                {
                    userId: user.id,
                })
            .andWhere("message.conversation_id = :conversationId",
                {
                    conversationId: room.id,
                })
            .andWhere("message.created_at > :after",
                {
                    after,
                })
            .getCount()
        const currentlyMuted =
      participation?.accessState === "muted" &&
      (!participation.mutedUntil ||
        participation.mutedUntil.getTime() > Date.now())
        return {
            conversationId: room.id,
            accessState: participation?.accessState ?? "active",
            canWrite: participation?.accessState !== "banned" && !currentlyMuted,
            notificationsMuted: participation?.notificationsMuted ?? false,
            unreadCount,
            mentionCount,
            lastReadMessageId: readState?.lastReadMessageId ?? null,
        }
    }

    async listMessages(params: {
    user: UserEntity;
    cursor?: string;
    limit?: number;
  }): Promise<GlobalChatPageProjection> {
        const room = await this.getOrCreateRoom()
        await this.policy.assertCanRead({
            conversationId: room.id,
            user: params.user,
        })
        const limit = Math.min(Math.max(params.limit ?? 30,
            1),
        MAX_PAGE_SIZE)
        const cursor = this.decodeCursor(params.cursor)
        const query = this.entityManager
            .createQueryBuilder(ChatMessageEntity,
                "message")
            .leftJoinAndSelect("message.author",
                "author")
            .leftJoinAndSelect("message.replyTo",
                "replyTo")
            .where("message.conversation_id = :conversationId",
                {
                    conversationId: room.id,
                })
            .andWhere(
                `NOT EXISTS (
                SELECT 1 FROM chat_reports report
                WHERE report.message_id = message.id
                  AND report.reporter_id = :viewerId
                  AND report.reporter_hidden = true
            )`,
                {
                    viewerId: params.user.id,
                },
            )
            .orderBy("message.created_at",
                "DESC")
            .addOrderBy("message.id",
                "DESC")
            .take(limit + 1)
        if (cursor) {
            query.andWhere(
                "(message.created_at, message.id) < (:createdAt, :id)",
                cursor,
            )
        }
        const rows = await query.getMany()
        const hasMore = rows.length > limit
        const page = rows.slice(0,
            limit)
        const messageIds = page.map((message) => message.id)
        const reactions = messageIds.length
            ? await this.entityManager.find(ChatMessageReactionEntity,
                {
                    where: {
                        message: {
                            id: In(messageIds),
                        },
                    },
                })
            : []
        const mentions = messageIds.length
            ? await this.entityManager.find(ChatMessageMentionEntity,
                {
                    where: {
                        message: {
                            id: In(messageIds),
                        },
                        user: {
                            id: params.user.id,
                        },
                    },
                })
            : []
        const mentioned = new Set(mentions.map((mention) => mention.messageId))
        const items = page.map((message) => {
            const messageReactions = reactions.filter(
                (reaction) => reaction.messageId === message.id,
            )
            const reactionMap = new Map<string, GlobalChatReactionProjection>()
            for (const reaction of messageReactions) {
                const current = reactionMap.get(reaction.emoji) ?? {
                    emoji: reaction.emoji,
                    count: 0,
                    reactedByViewer: false,
                }
                current.count += 1
                current.reactedByViewer ||= reaction.userId === params.user.id
                reactionMap.set(reaction.emoji,
                    current)
            }
            return this.projectMessage(
                message,
                params.user.id,
                [...reactionMap.values()],
                mentioned.has(message.id),
            )
        })
        const tail = page.at(-1)
        return {
            items,
            nextCursor:
        hasMore && tail ? this.encodeCursor(tail.createdAt,
            tail.id) : null,
        }
    }

    async sendMessage(params: {
    user: UserEntity;
    commandId: string;
    body: string;
    replyToId?: string;
    mentionUserIds?: Array<string>;
  }): Promise<GlobalChatCommandResult> {
        this.validateBody(params.body)
        return this.executeCommand(
            params.user,
            params.commandId,
            "send-message",
            async (manager) => {
                const room = await this.getOrCreateRoom(manager)
                await this.policy.assertCanWrite({
                    conversationId: room.id,
                    user: params.user,
                    entityManager: manager,
                })
                if (params.replyToId) {
                    const reply = await manager.findOne(ChatMessageEntity,
                        {
                            where: {
                                id: params.replyToId,
                                conversation: {
                                    id: room.id,
                                },
                            },
                        })
                    if (!reply)
                        throw invalidGlobalChatRequest(
                            "Reply target is not in Global Chat",
                            "GLOBAL_CHAT_REPLY_TARGET_INVALID",
                        )
                }
                const message = await manager.save(
                    manager.create(ChatMessageEntity,
                        {
                            body: params.body.trim(),
                            isDeleted: false,
                            version: 1,
                            editedAt: null,
                            removedAt: null,
                            removedByModerator: false,
                            removalReason: null,
                            conversation: {
                                id: room.id,
                            },
                            author: {
                                id: params.user.id,
                            },
                            replyTo: params.replyToId
                                ? {
                                    id: params.replyToId,
                                }
                                : null,
                        }),
                )
                const mentionIds = [...new Set(params.mentionUserIds ?? [])].filter(
                    (id) => id !== params.user.id,
                )
                if (mentionIds.length) {
                    const users = await manager.find(UserEntity,
                        {
                            where: {
                                id: In(mentionIds),
                            },
                        })
                    await manager.save(
                        users.map((user) =>
                            manager.create(ChatMessageMentionEntity,
                                {
                                    message: {
                                        id: message.id,
                                    },
                                    user: {
                                        id: user.id,
                                    },
                                }),
                        ),
                    )
                }
                await this.enqueue(
                    manager,
                    params.commandId,
                    room.id,
                    "message-created",
                    message.id,
                    params.user.id,
                )
                return {
                    commandId: params.commandId,
                    conversationId: room.id,
                    messageId: message.id,
                    version: message.version,
                }
            },
        )
    }

    async toggleReaction(params: {
    user: UserEntity;
    commandId: string;
    messageId: string;
    emoji: string;
  }): Promise<GlobalChatCommandResult> {
        const emoji = params.emoji.trim()
        if (!emoji || emoji.length > 32)
            throw invalidGlobalChatRequest(
                "Reaction emoji is invalid",
                "GLOBAL_CHAT_REACTION_INVALID",
            )
        return this.executeCommand(
            params.user,
            params.commandId,
            "toggle-reaction",
            async (manager) => {
                const { room, message } = await this.messageForWrite(
                    manager,
                    params.user,
                    params.messageId,
                )
                const existing = await manager.findOne(ChatMessageReactionEntity,
                    {
                        where: {
                            message: {
                                id: message.id,
                            },
                            user: {
                                id: params.user.id,
                            },
                            emoji,
                        },
                    })
                let active = true
                if (existing) {
                    await manager.remove(existing)
                    active = false
                } else {
                    await manager.save(
                        manager.create(ChatMessageReactionEntity,
                            {
                                message: {
                                    id: message.id,
                                },
                                user: {
                                    id: params.user.id,
                                },
                                emoji,
                            }),
                    )
                }
                await this.enqueue(
                    manager,
                    params.commandId,
                    room.id,
                    "reaction-changed",
                    message.id,
                    params.user.id,
                )
                return {
                    commandId: params.commandId,
                    conversationId: room.id,
                    messageId: message.id,
                    active,
                }
            },
        )
    }

    async editMessage(params: {
    user: UserEntity;
    commandId: string;
    messageId: string;
    body: string;
    expectedVersion: number;
  }): Promise<GlobalChatCommandResult> {
        this.validateBody(params.body)
        return this.executeCommand(
            params.user,
            params.commandId,
            "edit-message",
            async (manager) => {
                const { room } = await this.messageForWrite(
                    manager,
                    params.user,
                    params.messageId,
                )
                const result = await manager
                    .createQueryBuilder()
                    .update(ChatMessageEntity)
                    .set({
                        body: params.body.trim(),
                        editedAt: new Date(),
                        version: () => "\"version\" + 1",
                    })
                    .where(
                        "id = :messageId AND user_id = :userId AND version = :version AND is_deleted = false",
                        {
                            messageId: params.messageId,
                            userId: params.user.id,
                            version: params.expectedVersion,
                        },
                    )
                    .execute()
                if (!result.affected)
                    throw conflictingGlobalChatCommand(
                        "Message changed; refresh before editing",
                        "GLOBAL_CHAT_EDIT_VERSION_CONFLICT",
                    )
                await this.enqueue(
                    manager,
                    params.commandId,
                    room.id,
                    "message-edited",
                    params.messageId,
                    params.user.id,
                )
                return {
                    commandId: params.commandId,
                    conversationId: room.id,
                    messageId: params.messageId,
                    version: params.expectedVersion + 1,
                }
            },
        )
    }

    async removeMessage(params: {
    user: UserEntity;
    commandId: string;
    messageId: string;
    expectedVersion: number;
  }): Promise<GlobalChatCommandResult> {
        return this.executeCommand(
            params.user,
            params.commandId,
            "remove-message",
            async (manager) => {
                const { room } = await this.messageForWrite(
                    manager,
                    params.user,
                    params.messageId,
                )
                const result = await manager
                    .createQueryBuilder()
                    .update(ChatMessageEntity)
                    .set({
                        isDeleted: true,
                        removedAt: new Date(),
                        removedByModerator: false,
                        version: () => "\"version\" + 1",
                    })
                    .where(
                        "id = :messageId AND user_id = :userId AND version = :version AND is_deleted = false",
                        {
                            messageId: params.messageId,
                            userId: params.user.id,
                            version: params.expectedVersion,
                        },
                    )
                    .execute()
                if (!result.affected)
                    throw conflictingGlobalChatCommand(
                        "Message changed; refresh before removing",
                        "GLOBAL_CHAT_REMOVE_VERSION_CONFLICT",
                    )
                await this.enqueue(
                    manager,
                    params.commandId,
                    room.id,
                    "message-removed",
                    params.messageId,
                    params.user.id,
                )
                return {
                    commandId: params.commandId,
                    conversationId: room.id,
                    messageId: params.messageId,
                    version: params.expectedVersion + 1,
                }
            },
        )
    }

    async markRead(params: {
    user: UserEntity;
    commandId: string;
    messageId: string;
  }): Promise<GlobalChatCommandResult> {
        return this.executeCommand(
            params.user,
            params.commandId,
            "mark-read",
            async (manager) => {
                const room = await this.getOrCreateRoom(manager)
                await this.policy.assertCanRead({
                    conversationId: room.id,
                    user: params.user,
                    entityManager: manager,
                })
                const message = await manager.findOne(ChatMessageEntity,
                    {
                        where: {
                            id: params.messageId,
                            conversation: {
                                id: room.id,
                            },
                        },
                    })
                if (!message)
                    throw missingGlobalChatResource(
                        "Global Chat message was not found",
                        "GLOBAL_CHAT_MESSAGE_NOT_FOUND",
                    )
                const current = await manager.findOne(ChatReadStateEntity,
                    {
                        where: {
                            conversation: {
                                id: room.id,
                            },
                            user: {
                                id: params.user.id,
                            },
                        },
                    })
                if (
                    !current ||
          !current.lastReadAt ||
          current.lastReadAt < message.createdAt
                ) {
                    const state =
            current ??
            manager.create(ChatReadStateEntity,
                {
                    conversation: {
                        id: room.id,
                    },
                    user: {
                        id: params.user.id,
                    },
                })
                    state.lastReadMessage = message
                    state.lastReadAt = message.createdAt
                    await manager.save(state)
                }
                return {
                    commandId: params.commandId,
                    conversationId: room.id,
                    messageId: message.id,
                }
            },
        )
    }

    async report(params: {
    user: UserEntity;
    commandId: string;
    messageId?: string;
    reportedUserId?: string;
    category: string;
    details?: string;
  }): Promise<GlobalChatCommandResult> {
        if (!params.messageId && !params.reportedUserId)
            throw invalidGlobalChatRequest(
                "A message or member is required",
                "GLOBAL_CHAT_REPORT_TARGET_REQUIRED",
            )
        if (!params.category.trim())
            throw invalidGlobalChatRequest(
                "A report category is required",
                "GLOBAL_CHAT_REPORT_CATEGORY_REQUIRED",
            )
        return this.executeCommand(
            params.user,
            params.commandId,
            "report",
            async (manager) => {
                const room = await this.getOrCreateRoom(manager)
                await this.policy.assertCanRead({
                    conversationId: room.id,
                    user: params.user,
                    entityManager: manager,
                })
                const message = params.messageId
                    ? await manager.findOne(ChatMessageEntity,
                        {
                            where: {
                                id: params.messageId,
                                conversation: {
                                    id: room.id,
                                },
                            },
                            relations: {
                                author: true,
                            },
                        })
                    : null
                if (params.messageId && !message)
                    throw missingGlobalChatResource(
                        "Global Chat message was not found",
                        "GLOBAL_CHAT_MESSAGE_NOT_FOUND",
                    )
                const reportedUserId =
          params.reportedUserId ?? message?.authorId ?? null
                const report = await manager.save(
                    manager.create(ChatReportEntity,
                        {
                            conversation: {
                                id: room.id,
                            },
                            message: message
                                ? {
                                    id: message.id,
                                }
                                : null,
                            reportedUser: reportedUserId
                                ? {
                                    id: reportedUserId,
                                }
                                : null,
                            reporter: {
                                id: params.user.id,
                            },
                            category: params.category.trim(),
                            details: params.details?.trim() || null,
                            status: "open",
                            reporterHidden: Boolean(message),
                        }),
                )
                const moderationCase = await manager.save(
                    manager.create(ChatModerationCaseEntity,
                        {
                            report: {
                                id: report.id,
                            },
                            assignee: null,
                            status: "open",
                            outcome: null,
                            reason: null,
                            evidence: {
                                messageId: message?.id ?? null,
                                messageBody: message?.body ?? null,
                                messageVersion: message?.version ?? null,
                                reportedUserId,
                                capturedAt: new Date().toISOString(),
                            },
                            version: 1,
                            resolvedAt: null,
                        }),
                )
                await this.enqueue(
                    manager,
                    params.commandId,
                    room.id,
                    "report-created",
                    message?.id ?? null,
                    params.user.id,
                )
                return {
                    commandId: params.commandId,
                    conversationId: room.id,
                    messageId: message?.id,
                    reportId: report.id,
                    caseId: moderationCase.id,
                    status: "open",
                }
            },
        )
    }

    async moderationQueue(params: {
    user: UserEntity;
    status?: string;
    limit?: number;
  }): Promise<Array<GlobalChatModerationCaseProjection>> {
        const room = await this.getOrCreateRoom()
        await this.policy.assertModerator({
            conversationId: room.id,
            user: params.user,
        })
        const cases = await this.entityManager.find(ChatModerationCaseEntity,
            {
                where: params.status
                    ? {
                        status: params.status,
                    }
                    : {
                    },
                relations: {
                    report: {
                        reporter: true,
                        reportedUser: true,
                        message: true,
                    },
                },
                order: {
                    createdAt: "ASC",
                },
                take: Math.min(Math.max(params.limit ?? 50,
                    1),
                100),
            })
        return cases.map((moderationCase) => this.projectCase(moderationCase))
    }

    async moderate(params: {
    user: UserEntity;
    commandId: string;
    caseId: string;
    action: string;
    reason: string;
    expectedVersion: number;
    mutedUntil?: Date;
  }): Promise<GlobalChatCommandResult> {
        if (!params.reason.trim())
            throw invalidGlobalChatRequest(
                "A moderation reason is required",
                "GLOBAL_CHAT_MODERATION_REASON_REQUIRED",
            )
        const supported = [
            "dismiss",
            "remove",
            "mute",
            "ban",
            "escalate",
            "restore",
        ]
        if (!supported.includes(params.action))
            throw invalidGlobalChatRequest(
                "Unsupported moderation action",
                "GLOBAL_CHAT_MODERATION_ACTION_INVALID",
            )
        return this.executeCommand(
            params.user,
            params.commandId,
            "moderate",
            async (manager) => {
                const room = await this.getOrCreateRoom(manager)
                await this.policy.assertModerator({
                    conversationId: room.id,
                    user: params.user,
                    entityManager: manager,
                })
                const moderationCase = await manager.findOne(ChatModerationCaseEntity,
                    {
                        where: {
                            id: params.caseId,
                        },
                        relations: {
                            report: {
                                message: true,
                                reportedUser: true,
                            },
                        },
                        lock: {
                            mode: "pessimistic_write",
                        },
                    })
                if (!moderationCase)
                    throw missingGlobalChatResource(
                        "Moderation case was not found",
                        "GLOBAL_CHAT_MODERATION_CASE_NOT_FOUND",
                    )
                if (moderationCase.version !== params.expectedVersion)
                    throw conflictingGlobalChatCommand(
                        "Moderation case changed; refresh before deciding",
                        "GLOBAL_CHAT_MODERATION_VERSION_CONFLICT",
                    )
                const targetUserId =
          moderationCase.report.reportedUserId ??
          moderationCase.report.message?.authorId ??
          null
                if (params.action === "remove" && moderationCase.report.message) {
                    await manager.update(
                        ChatMessageEntity,
                        {
                            id: moderationCase.report.message.id,
                        },
                        {
                            isDeleted: true,
                            removedAt: new Date(),
                            removedByModerator: true,
                            removalReason: params.reason.trim(),
                            version: () => "\"version\" + 1",
                        },
                    )
                }
                if (params.action === "restore" && moderationCase.report.message) {
                    await manager.update(
                        ChatMessageEntity,
                        {
                            id: moderationCase.report.message.id,
                        },
                        {
                            isDeleted: false,
                            removedAt: null,
                            removedByModerator: false,
                            removalReason: null,
                            version: () => "\"version\" + 1",
                        },
                    )
                }
                if (
                    ["mute",
                        "ban",
                        "restore"].includes(params.action) &&
          targetUserId
                ) {
                    const participation = await this.getOrCreateParticipation(
                        manager,
                        room.id,
                        targetUserId,
                    )
                    participation.accessState =
            params.action === "ban"
                ? "banned"
                : params.action === "mute"
                    ? "muted"
                    : "active"
                    participation.mutedUntil =
            params.action === "mute" ? (params.mutedUntil ?? null) : null
                    await manager.save(participation)
                }
                moderationCase.status =
          params.action === "escalate"
              ? "escalated"
              : params.action === "dismiss"
                  ? "dismissed"
                  : "actioned"
                moderationCase.outcome = params.action
                moderationCase.reason = params.reason.trim()
                moderationCase.assignee = params.user
                moderationCase.version += 1
                moderationCase.resolvedAt =
          params.action === "escalate" ? null : new Date()
                await manager.save(moderationCase)
                moderationCase.report.status = moderationCase.status
                await manager.save(moderationCase.report)
                await manager.save(
                    manager.create(ChatModerationAuditEntity,
                        {
                            moderationCase: {
                                id: moderationCase.id,
                            },
                            actor: {
                                id: params.user.id,
                            },
                            action: params.action,
                            reason: params.reason.trim(),
                            metadata: {
                                targetUserId,
                            },
                        }),
                )
                await this.enqueue(
                    manager,
                    params.commandId,
                    room.id,
                    "moderation-changed",
                    moderationCase.report.messageId,
                    params.user.id,
                )
                return {
                    commandId: params.commandId,
                    conversationId: room.id,
                    messageId: moderationCase.report.messageId ?? undefined,
                    caseId: moderationCase.id,
                    version: moderationCase.version,
                    status: moderationCase.status,
                }
            },
        )
    }

    async setRole(params: {
    actor: UserEntity;
    targetUserId: string;
    role: "member" | "moderator" | "admin";
  }): Promise<ChatParticipationEntity> {
        const room = await this.getOrCreateRoom()
        const participation = await this.getOrCreateParticipation(
            this.entityManager,
            room.id,
            params.targetUserId,
        )
        participation.role = params.role
        return this.entityManager.save(participation)
    }

    async setNotificationsMuted(params: {
    user: UserEntity;
    commandId: string;
    muted: boolean;
  }): Promise<GlobalChatCommandResult> {
        return this.executeCommand(
            params.user,
            params.commandId,
            "notification-preference",
            async (manager) => {
                const room = await this.getOrCreateRoom(manager)
                await this.policy.assertCanRead({
                    conversationId: room.id,
                    user: params.user,
                    entityManager: manager,
                })
                const participation = await this.getOrCreateParticipation(
                    manager,
                    room.id,
                    params.user.id,
                )
                participation.notificationsMuted = params.muted
                await manager.save(participation)
                return {
                    commandId: params.commandId,
                    conversationId: room.id,
                    active: !params.muted,
                }
            },
        )
    }

    private async messageForWrite(
        manager: EntityManager,
        user: UserEntity,
        messageId: string,
    ): Promise<{ room: ChatConversationEntity; message: ChatMessageEntity }> {
        const room = await this.getOrCreateRoom(manager)
        await this.policy.assertCanWrite({
            conversationId: room.id,
            user,
            entityManager: manager,
        })
        const message = await manager.findOne(ChatMessageEntity,
            {
                where: {
                    id: messageId,
                    conversation: {
                        id: room.id,
                    },
                },
            })
        if (!message || message.isDeleted)
            throw missingGlobalChatResource(
                "Global Chat message was not found",
                "GLOBAL_CHAT_MESSAGE_NOT_FOUND",
            )
        return {
            room,
            message,
        }
    }

    private async getOrCreateParticipation(
        manager: EntityManager,
        conversationId: string,
        userId: string,
    ): Promise<ChatParticipationEntity> {
        await manager
            .createQueryBuilder()
            .insert()
            .into(ChatParticipationEntity)
            .values({
                conversation: {
                    id: conversationId,
                },
                user: {
                    id: userId,
                },
                accessState: "active",
                role: "member",
                mutedUntil: null,
                notificationsMuted: false,
            })
            .orIgnore()
            .execute()
        const participation = await manager.findOne(ChatParticipationEntity,
            {
                where: {
                    conversation: {
                        id: conversationId,
                    },
                    user: {
                        id: userId,
                    },
                },
            })
        if (!participation)
            throw missingGlobalChatResource(
                "Global Chat participation could not be initialized",
                "GLOBAL_CHAT_PARTICIPATION_NOT_FOUND",
            )
        return participation
    }

    private async executeCommand<T>(
        user: UserEntity,
        commandId: string,
        commandType: string,
        execute: (manager: EntityManager) => Promise<T>,
    ): Promise<T> {
        const normalizedId = commandId.trim()
        if (!normalizedId || normalizedId.length > 128)
            throw invalidGlobalChatRequest(
                "clientCommandId is required",
                "GLOBAL_CHAT_COMMAND_ID_INVALID",
            )
        const replay = await this.findReceipt<T>(
            user.id,
            normalizedId,
            commandType,
        )
        if (replay) {
            this.metrics.commandReplayed()
            return replay
        }
        try {
            const result = await this.entityManager.transaction(async (manager) => {
                const insideReplay = await this.findReceipt<T>(
                    user.id,
                    normalizedId,
                    commandType,
                    manager,
                )
                if (insideReplay) return insideReplay
                const value = await execute(manager)
                await manager.save(
                    manager.create(ChatCommandReceiptEntity,
                        {
                            actor: {
                                id: user.id,
                            },
                            commandId: normalizedId,
                            commandType,
                            response: JSON.parse(JSON.stringify(value)) as Record<
              string,
              unknown
            >,
                        }),
                )
                return value
            })
            this.metrics.commandAccepted()
            return result
        } catch (error) {
            const racedReplay = await this.findReceipt<T>(
                user.id,
                normalizedId,
                commandType,
            )
            if (racedReplay) {
                this.metrics.commandReplayed()
                return racedReplay
            }
            throw error
        }
    }

    private async findReceipt<T>(
        actorId: string,
        commandId: string,
        commandType: string,
        manager: EntityManager = this.entityManager,
    ): Promise<T | null> {
        const receipt = await manager.findOne(ChatCommandReceiptEntity,
            {
                where: {
                    actor: {
                        id: actorId,
                    },
                    commandId,
                },
            })
        if (!receipt) return null
        if (receipt.commandType !== commandType)
            throw conflictingGlobalChatCommand(
                "clientCommandId was already used for another command",
                "GLOBAL_CHAT_COMMAND_ID_CONFLICT",
            )
        return receipt.response as T
    }

    private async enqueue(
        manager: EntityManager,
        commandId: string,
        conversationId: string,
        eventType: string,
        messageId: string | null,
        actorId: string,
    ): Promise<void> {
        await manager.save(
            manager.create(ChatOutboxEntity,
                {
                    eventKey: `${actorId}:${commandId}:${eventType}`,
                    eventType,
                    aggregateId: conversationId,
                    payload: {
                        conversationId,
                        messageId,
                        actorId,
                    },
                    availableAt: new Date(),
                    publishedAt: null,
                    lockedAt: null,
                    attempts: 0,
                    lastError: null,
                }),
        )
    }

    private validateBody(body: string): void {
        const value = body.trim()
        if (!value || value.length > MAX_BODY_LENGTH)
            throw invalidGlobalChatRequest(
                "Message must contain 1 to 4000 characters",
                "GLOBAL_CHAT_MESSAGE_BODY_INVALID",
            )
        const links = value.match(/https?:\/\/[^\s]+/g) ?? []
        for (const link of links) {
            let url: URL
            try {
                url = new URL(link)
            } catch {
                throw invalidGlobalChatRequest(
                    "Message contains an unsafe link",
                    "GLOBAL_CHAT_MESSAGE_LINK_INVALID",
                )
            }
            if (!["http:",
                "https:"].includes(url.protocol))
                throw invalidGlobalChatRequest(
                    "Message contains an unsafe link",
                    "GLOBAL_CHAT_MESSAGE_LINK_INVALID",
                )
        }
    }

    private projectMessage(
        message: ChatMessageEntity,
        viewerId: string,
        reactions: Array<GlobalChatReactionProjection>,
        mentionedViewer: boolean,
    ): GlobalChatMessageProjection {
        return {
            id: message.id,
            body: message.isDeleted ? null : message.body,
            authorId: message.authorId,
            authorName:
        message.author?.displayName ?? message.author?.username ?? "Member",
            authorAvatar: message.author?.avatar ?? null,
            replyToId: message.replyToId ?? null,
            version: message.version,
            editedAt: message.editedAt,
            removedAt: message.removedAt,
            removalState: message.isDeleted
                ? message.removedByModerator
                    ? "moderator-removed"
                    : "author-removed"
                : null,
            createdAt: message.createdAt,
            reactions,
            mentionedViewer,
            isMine: message.authorId === viewerId,
        }
    }

    private projectCase(
        moderationCase: ChatModerationCaseEntity,
    ): GlobalChatModerationCaseProjection {
        return {
            id: moderationCase.id,
            reportId: moderationCase.reportId,
            messageId: moderationCase.report.messageId,
            reportedUserId: moderationCase.report.reportedUserId,
            reporterId: moderationCase.report.reporterId,
            category: moderationCase.report.category,
            details: moderationCase.report.details,
            status: moderationCase.status,
            outcome: moderationCase.outcome,
            reason: moderationCase.reason,
            version: moderationCase.version,
            evidence: moderationCase.evidence,
            createdAt: moderationCase.createdAt,
        }
    }

    private encodeCursor(createdAt: Date, id: string): string {
        return Buffer.from(
            JSON.stringify({
                createdAt: createdAt.toISOString(),
                id,
            }),
            "utf8",
        ).toString("base64url")
    }

    private decodeCursor(
        cursor?: string,
    ): { createdAt: Date; id: string } | null {
        if (!cursor) return null
        try {
            const parsed = JSON.parse(
                Buffer.from(cursor,
                    "base64url").toString("utf8"),
            ) as { createdAt?: string; id?: string }
            const createdAt = new Date(parsed.createdAt ?? "")
            return parsed.id && Number.isFinite(createdAt.getTime())
                ? {
                    createdAt,
                    id: parsed.id,
                }
                : null
        } catch {
            return null
        }
    }
}
