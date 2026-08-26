import type {
    EntityManager
} from "typeorm"
import type {
    UserEntity
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    GlobalChatMetricsService
} from "./global-chat-metrics.service"
import {
    GlobalChatPolicyService
} from "./global-chat-policy.service"
import {
    GlobalChatService
} from "./global-chat.service"
import {
    GlobalChatMutationService
} from "@features/api/core/graphql/mutations/chat/global-chat/global-chat.service"
import {
    GlobalChatMutationResolver
} from "@features/api/core/graphql/mutations/chat/global-chat/global-chat.resolver"
import {
    GlobalChatQueryService
} from "@features/api/core/graphql/queries/chat/global-chat/global-chat.service"
import {
    GlobalChatResolver
} from "@features/api/core/graphql/queries/chat/global-chat/global-chat.resolver"
import {
    AddGlobalChatRelationalOutbox1787700000000
} from "@modules/databases/postgresql/primary/migrations/1787700000000-AddGlobalChatRelationalOutbox"

const user = {
    id: "member-1",
} as UserEntity
const room = {
    id: "global-room",
}
const reactionEmoji = String.fromCodePoint(0x1f44d)

function queryBuilder(
    overrides: Record<string, jest.Mock> = {
    },
): Record<string, jest.Mock> {
    const builder: Record<string, jest.Mock> = {
        insert: jest.fn(),
        update: jest.fn(),
        into: jest.fn(),
        values: jest.fn(),
        set: jest.fn(),
        orIgnore: jest.fn(),
        execute: jest.fn().mockResolvedValue({
            affected: 1,
        }),
        leftJoinAndSelect: jest.fn(),
        where: jest.fn(),
        andWhere: jest.fn(),
        orderBy: jest.fn(),
        addOrderBy: jest.fn(),
        take: jest.fn(),
        innerJoin: jest.fn(),
        getCount: jest.fn().mockResolvedValue(0),
        getMany: jest.fn().mockResolvedValue([]),
        ...overrides,
    }
    for (const method of [
        "insert",
        "update",
        "into",
        "values",
        "set",
        "orIgnore",
        "innerJoin",
        "leftJoinAndSelect",
        "where",
        "andWhere",
        "orderBy",
        "addOrderBy",
        "take",
    ]) {
        builder[method].mockReturnValue(builder)
    }
    return builder
}

interface GlobalChatEntityManagerMock {
  createQueryBuilder: jest.Mock;
  findOne: jest.Mock;
  find: jest.Mock;
  count: jest.Mock;
  transaction: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  remove: jest.Mock;
}

function managerMock(): GlobalChatEntityManagerMock {
    return {
        createQueryBuilder: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        transaction: jest.fn(),
        save: jest.fn(),
        create: jest.fn((_target, value) => value),
        update: jest.fn(),
        remove: jest.fn(),
    }
}

function prepareCommandManager(manager: GlobalChatEntityManagerMock): void {
    manager.createQueryBuilder.mockImplementation(() => queryBuilder())
    manager.transaction.mockImplementation(
        async (callback: (value: EntityManager) => Promise<unknown>) =>
            callback(manager as unknown as EntityManager),
    )
    manager.create.mockImplementation(
        (target: { name?: string }, value: Record<string, unknown>) => {
            const ids: Record<string, string> = {
                ChatMessageEntity: "message-1",
                ChatReportEntity: "report-1",
                ChatModerationCaseEntity: "case-1",
            }
            return {
                ...value,
                ...(ids[target.name ?? ""]
                    ? {
                        id: ids[target.name ?? ""],
                    }
                    : {
                    }),
            }
        },
    )
    manager.save.mockImplementation(async (value: unknown) => value)
}

describe("GlobalChatService",
    () => {
        let manager: ReturnType<typeof managerMock>
        let policy: jest.Mocked<
    Pick<
      GlobalChatPolicyService,
      "assertCanRead" | "assertCanWrite" | "assertModerator"
    >
  >
        let metrics: GlobalChatMetricsService
        let service: GlobalChatService

        beforeEach(() => {
            manager = managerMock()
            prepareCommandManager(manager)
            policy = {
                assertCanRead: jest.fn().mockResolvedValue(null),
                assertCanWrite: jest.fn().mockResolvedValue(null),
                assertModerator: jest.fn(),
            }
            metrics = new GlobalChatMetricsService()
            service = new GlobalChatService(
      manager as unknown as EntityManager,
      policy as unknown as GlobalChatPolicyService,
      metrics,
            )
        })

        it("replays the actor-scoped command receipt without performing another write",
            async () => {
                const response = {
                    commandId: "command-1",
                    conversationId: room.id,
                    messageId: "message-1",
                }
                manager.findOne.mockResolvedValueOnce({
                    commandType: "send-message",
                    response,
                })

                await expect(
                    service.sendMessage({
                        user,
                        commandId: "command-1",
                        body: "Hello",
                    }),
                ).resolves.toEqual(response)

                expect(manager.transaction).not.toHaveBeenCalled()
                expect(metrics.snapshot()).toEqual(
                    expect.objectContaining({
                        replayedCommands: 1,
                        acceptedCommands: 0,
                    }),
                )
            })

        it("rejects reuse of a client command id for a different command type",
            async () => {
                manager.findOne.mockResolvedValueOnce({
                    commandType: "report",
                    response: {
                    },
                })

                await expect(
                    service.sendMessage({
                        user,
                        commandId: "command-1",
                        body: "Hello",
                    }),
                ).rejects.toMatchObject({
                    code: "GLOBAL_CHAT_COMMAND_ID_CONFLICT",
                })
                expect(manager.transaction).not.toHaveBeenCalled()
            })

        it("fails room initialization when the idempotent insert leaves no room row",
            async () => {
                manager.findOne.mockResolvedValueOnce(null)

                await expect(service.getOrCreateRoom()).rejects.toThrow(
                    "Global Chat room could not be initialized",
                )
                expect(manager.createQueryBuilder).toHaveBeenCalled()
            })

        it("keeps reporter-local hiding inside the canonical history query",
            async () => {
                const roomInsert = queryBuilder()
                const history = queryBuilder()
                manager.createQueryBuilder
                    .mockReturnValueOnce(roomInsert as never)
                    .mockReturnValueOnce(history as never)
                manager.findOne.mockResolvedValueOnce(room)

                await expect(
                    service.listMessages({
                        user,
                    }),
                ).resolves.toEqual({
                    items: [],
                    nextCursor: null,
                })

                expect(history.andWhere).toHaveBeenCalledWith(
                    expect.stringContaining("report.reporter_id = :viewerId"),
                    {
                        viewerId: user.id,
                    },
                )
            })

        it("uses a stable createdAt and id cursor at the page boundary",
            async () => {
                const createdAt = new Date("2026-08-25T12:00:00.000Z")
                const roomInsert = queryBuilder()
                const history = queryBuilder({
                    getMany: jest.fn().mockResolvedValue([
                        {
                            id: "message-b",
                            authorId: "member-2",
                            author: {
                            },
                            createdAt,
                            isDeleted: false,
                            body: "B",
                            version: 1,
                            editedAt: null,
                            removedAt: null,
                            removedByModerator: false,
                        },
                        {
                            id: "message-a",
                            authorId: "member-2",
                            author: {
                            },
                            createdAt,
                            isDeleted: false,
                            body: "A",
                            version: 1,
                            editedAt: null,
                            removedAt: null,
                            removedByModerator: false,
                        },
                    ]),
                })
                manager.createQueryBuilder
                    .mockReturnValueOnce(roomInsert as never)
                    .mockReturnValueOnce(history as never)
                manager.findOne.mockResolvedValueOnce(room)

                const page = await service.listMessages({
                    user,
                    limit: 1,
                })
                const cursor = JSON.parse(
                    Buffer.from(page.nextCursor ?? "",
                        "base64url").toString("utf8"),
                ) as Record<string, string>

                expect(page.items).toHaveLength(1)
                expect(cursor).toEqual({
                    createdAt: createdAt.toISOString(),
                    id: "message-b",
                })
                expect(history.addOrderBy).toHaveBeenCalledWith("message.id",
                    "DESC")
            })

        it("requires a reason before any moderation state can change",
            async () => {
                await expect(
                    service.moderate({
                        user,
                        commandId: "command-1",
                        caseId: "case-1",
                        action: "remove",
                        reason: "   ",
                        expectedVersion: 1,
                    }),
                ).rejects.toMatchObject({
                    code: "GLOBAL_CHAT_MODERATION_REASON_REQUIRED",
                })
                expect(manager.transaction).not.toHaveBeenCalled()
            })

        it("projects actor-specific room state including unread mentions and mute state",
            async () => {
                const mentionQuery = queryBuilder({
                    getCount: jest.fn().mockResolvedValue(2),
                })
                manager.createQueryBuilder
                    .mockReturnValueOnce(queryBuilder() as never)
                    .mockReturnValueOnce(mentionQuery as never)
                manager.findOne.mockResolvedValueOnce(room).mockResolvedValueOnce({
                    lastReadAt: new Date("2026-08-25T10:00:00.000Z"),
                    lastReadMessageId: "message-0",
                })
                manager.count.mockResolvedValueOnce(4)
                policy.assertCanRead.mockResolvedValueOnce({
                    accessState: "muted",
                    mutedUntil: new Date(Date.now() + 60_000),
                    notificationsMuted: true,
                } as never)

                await expect(service.roomState(user)).resolves.toEqual({
                    conversationId: room.id,
                    accessState: "muted",
                    canWrite: false,
                    notificationsMuted: true,
                    unreadCount: 4,
                    mentionCount: 2,
                    lastReadMessageId: "message-0",
                })
            })

        it("defaults room state for a member without participation or read state",
            async () => {
                manager.findOne
                    .mockResolvedValueOnce(room)
                    .mockResolvedValueOnce(null)
                policy.assertCanRead.mockResolvedValueOnce(null)
                manager.count.mockResolvedValueOnce(0)

                await expect(service.roomState(user)).resolves.toEqual({
                    conversationId: room.id,
                    accessState: "active",
                    canWrite: true,
                    notificationsMuted: false,
                    unreadCount: 0,
                    mentionCount: 0,
                    lastReadMessageId: null,
                })
            })

        it("projects reactions, mentions and removed-message state from history",
            async () => {
                const createdAt = new Date("2026-08-25T12:00:00.000Z")
                manager.createQueryBuilder
                    .mockReturnValueOnce(queryBuilder() as never)
                    .mockReturnValueOnce(
        queryBuilder({
            getMany: jest.fn().mockResolvedValue([
                {
                    id: "message-1",
                    authorId: user.id,
                    author: {
                        username: "stacy",
                        avatar: "avatar.png",
                    },
                    replyToId: "message-0",
                    createdAt,
                    isDeleted: true,
                    body: "hidden",
                    version: 2,
                    editedAt: createdAt,
                    removedAt: createdAt,
                    removedByModerator: true,
                },
            ]),
        }) as never,
                    )
                manager.findOne.mockResolvedValueOnce(room)
                manager.find
                    .mockResolvedValueOnce([
                        {
                            messageId: "message-1",
                            emoji: reactionEmoji,
                            userId: user.id,
                        },
                        {
                            messageId: "message-1",
                            emoji: reactionEmoji,
                            userId: "member-2",
                        },
                    ])
                    .mockResolvedValueOnce([
                        {
                            messageId: "message-1",
                        },
                    ])

                const page = await service.listMessages({
                    user,
                    cursor: "not-a-cursor",
                })

                expect(page.items[0]).toEqual(
                    expect.objectContaining({
                        body: null,
                        authorName: "stacy",
                        removalState: "moderator-removed",
                        mentionedViewer: true,
                        isMine: true,
                        reactions: [
                            {
                                emoji: reactionEmoji,
                                count: 2,
                                reactedByViewer: true,
                            },
                        ],
                    }),
                )
            })

        it("creates one message, distinct mentions, receipt and outbox event atomically",
            async () => {
                manager.findOne.mockImplementation(async (target: { name?: string }) => {
                    if (target.name === "ChatConversationEntity") return room
                    if (target.name === "ChatMessageEntity")
                        return {
                            id: "reply-1",
                        }
                    return null
                })
                manager.find.mockResolvedValueOnce([
                    {
                        id: "member-2",
                    },
                    {
                        id: "member-3",
                    },
                ])

                await expect(
                    service.sendMessage({
                        user,
                        commandId: "send-1",
                        body: " Hello https://starci.vn ",
                        replyToId: "reply-1",
                        mentionUserIds: [user.id,
                            "member-2",
                            "member-2",
                            "member-3"],
                    }),
                ).resolves.toEqual({
                    commandId: "send-1",
                    conversationId: room.id,
                    messageId: "message-1",
                    version: 1,
                })
                expect(manager.transaction).toHaveBeenCalledTimes(1)
                expect(manager.save).toHaveBeenCalledWith(
                    expect.arrayContaining([
                        expect.objectContaining({
                            user: {
                                id: "member-2",
                            },
                        }),
                        expect.objectContaining({
                            user: {
                                id: "member-3",
                            },
                        }),
                    ]),
                )
                expect(metrics.snapshot()).toEqual(
                    expect.objectContaining({
                        acceptedCommands: 1,
                    }),
                )
            })

        it("toggles a reaction off and emits one invalidation",
            async () => {
                manager.findOne.mockImplementation(async (target: { name?: string }) => {
                    if (target.name === "ChatConversationEntity") return room
                    if (target.name === "ChatMessageEntity")
                        return {
                            id: "message-1",
                            isDeleted: false,
                        }
                    if (target.name === "ChatMessageReactionEntity")
                        return {
                            id: "reaction-1",
                        }
                    return null
                })

                await expect(
                    service.toggleReaction({
                        user,
                        commandId: "reaction-1",
                        messageId: "message-1",
                        emoji: ` ${reactionEmoji} `,
                    }),
                ).resolves.toEqual(
                    expect.objectContaining({
                        active: false,
                    }),
                )
                expect(manager.remove).toHaveBeenCalledWith({
                    id: "reaction-1",
                })
            })

        it("edits and removes an owned message with optimistic versions",
            async () => {
                manager.findOne.mockImplementation(async (target: { name?: string }) => {
                    if (target.name === "ChatConversationEntity") return room
                    if (target.name === "ChatMessageEntity")
                        return {
                            id: "message-1",
                            isDeleted: false,
                        }
                    return null
                })

                await expect(
                    service.editMessage({
                        user,
                        commandId: "edit-1",
                        messageId: "message-1",
                        body: "Edited",
                        expectedVersion: 1,
                    }),
                ).resolves.toEqual(
                    expect.objectContaining({
                        version: 2,
                    }),
                )
                await expect(
                    service.removeMessage({
                        user,
                        commandId: "remove-1",
                        messageId: "message-1",
                        expectedVersion: 2,
                    }),
                ).resolves.toEqual(
                    expect.objectContaining({
                        version: 3,
                    }),
                )
                const builders = manager.createQueryBuilder.mock.results
                    .map((result) => result.value as ReturnType<typeof queryBuilder>)
                const versionExpressions = builders
                    .flatMap((builder) => builder.set.mock.calls)
                    .map((call) => (call[0] as { version?: () => string }).version)
                    .filter((version): version is () => string => typeof version === "function")
                expect(versionExpressions).toHaveLength(2)
                expect(versionExpressions.map((version) => version())).toEqual([
                    "\"version\" + 1",
                    "\"version\" + 1",
                ])
            })

        it("advances read state only when the selected message is newer",
            async () => {
                const createdAt = new Date("2026-08-25T12:00:00.000Z")
                manager.findOne.mockImplementation(async (target: { name?: string }) => {
                    if (target.name === "ChatConversationEntity") return room
                    if (target.name === "ChatMessageEntity")
                        return {
                            id: "message-1",
                            createdAt,
                        }
                    return null
                })

                await expect(
                    service.markRead({
                        user,
                        commandId: "read-1",
                        messageId: "message-1",
                    }),
                ).resolves.toEqual(
                    expect.objectContaining({
                        messageId: "message-1",
                    }),
                )
                expect(manager.save).toHaveBeenCalledWith(
                    expect.objectContaining({
                        lastReadMessage: expect.objectContaining({
                            id: "message-1",
                        }),
                        lastReadAt: createdAt,
                    }),
                )
            })

        it("captures confidential report evidence and opens a moderation case",
            async () => {
                manager.findOne.mockImplementation(async (target: { name?: string }) => {
                    if (target.name === "ChatConversationEntity") return room
                    if (target.name === "ChatMessageEntity")
                        return {
                            id: "message-1",
                            authorId: "member-2",
                            body: "evidence",
                            version: 3,
                        }
                    return null
                })

                await expect(
                    service.report({
                        user,
                        commandId: "report-1",
                        messageId: "message-1",
                        category: " harassment ",
                        details: " details ",
                    }),
                ).resolves.toEqual(
                    expect.objectContaining({
                        reportId: "report-1",
                        caseId: "case-1",
                        status: "open",
                    }),
                )
                expect(manager.save).toHaveBeenCalledWith(
                    expect.objectContaining({
                        evidence: expect.objectContaining({
                            messageBody: "evidence",
                            reportedUserId: "member-2",
                        }),
                    }),
                )
            })

        it("returns moderator evidence and applies a ban with an immutable audit",
            async () => {
                const createdAt = new Date("2026-08-25T12:00:00.000Z")
                const moderationCase = {
                    id: "case-1",
                    reportId: "report-1",
                    status: "open",
                    outcome: null,
                    reason: null,
                    version: 1,
                    evidence: {
                        messageBody: "captured",
                    },
                    createdAt,
                    report: {
                        id: "report-1",
                        messageId: "message-1",
                        reportedUserId: "member-2",
                        reporterId: user.id,
                        category: "spam",
                        details: null,
                        status: "open",
                        message: {
                            id: "message-1",
                            authorId: "member-2",
                        },
                    },
                }
                manager.createQueryBuilder.mockReturnValue(queryBuilder() as never)
                manager.findOne.mockImplementation(async (target: { name?: string }) => {
                    if (target.name === "ChatConversationEntity") return room
                    if (target.name === "ChatModerationCaseEntity") return moderationCase
                    if (target.name === "ChatParticipationEntity")
                        return {
                            accessState: "active",
                            mutedUntil: null,
                        }
                    return null
                })
                manager.find.mockResolvedValueOnce([moderationCase])

                await expect(
                    service.moderationQueue({
                        user,
                    }),
                ).resolves.toEqual([
                    expect.objectContaining({
                        evidence: {
                            messageBody: "captured",
                        },
                    }),
                ])
                await expect(
                    service.moderate({
                        user,
                        commandId: "moderate-1",
                        caseId: "case-1",
                        action: "ban",
                        reason: " repeated abuse ",
                        expectedVersion: 1,
                    }),
                ).resolves.toEqual(
                    expect.objectContaining({
                        status: "actioned",
                        version: 2,
                    }),
                )
                expect(manager.save).toHaveBeenCalledWith(
                    expect.objectContaining({
                        accessState: "banned",
                    }),
                )
                expect(manager.save).toHaveBeenCalledWith(
                    expect.objectContaining({
                        action: "ban",
                        reason: "repeated abuse",
                    }),
                )
                await expect(service.moderate({
                    user,
                    commandId: "moderate-remove-1",
                    caseId: "case-1",
                    action: "remove",
                    reason: "remove content",
                    expectedVersion: 2,
                })).resolves.toEqual(expect.objectContaining({
                    status: "actioned",
                    version: 3,
                }))
                await expect(service.moderate({
                    user,
                    commandId: "moderate-restore-1",
                    caseId: "case-1",
                    action: "restore",
                    reason: "reviewed",
                    expectedVersion: 3,
                })).resolves.toEqual(expect.objectContaining({
                    status: "actioned",
                    version: 4,
                }))
                const updateCalls = manager.update.mock.calls
                expect(updateCalls.length).toBeGreaterThanOrEqual(1)
                const restoreUpdate = updateCalls.at(-1)?.[2] as {
                    version?: () => string
                }
                expect(restoreUpdate.version?.()).toBe("\"version\" + 1")
            })

        it("updates role and notification preference through canonical participation",
            async () => {
                const participation = {
                    role: "member",
                    accessState: "active",
                    notificationsMuted: false,
                }
                manager.findOne.mockImplementation(async (target: { name?: string }) => {
                    if (target.name === "ChatConversationEntity") return room
                    if (target.name === "ChatParticipationEntity") return participation
                    return null
                })

                await expect(
                    service.setRole({
                        actor: user,
                        targetUserId: "member-2",
                        role: "moderator",
                    }),
                ).resolves.toEqual(
                    expect.objectContaining({
                        role: "moderator",
                    }),
                )
                await expect(
                    service.setNotificationsMuted({
                        user,
                        commandId: "notifications-1",
                        muted: true,
                    }),
                ).resolves.toEqual(
                    expect.objectContaining({
                        active: false,
                    }),
                )
                expect(participation.notificationsMuted).toBe(true)
            })

        it("rejects invalid command, content, reaction and report inputs before writes",
            async () => {
                await expect(
                    service.sendMessage({
                        user,
                        commandId: "send-empty",
                        body: " ",
                    }),
                ).rejects.toMatchObject({
                    code: "GLOBAL_CHAT_MESSAGE_BODY_INVALID",
                })
                await expect(
                    service.sendMessage({
                        user,
                        commandId: "send-unsafe-link",
                        body: "See http://[bad",
                    }),
                ).rejects.toMatchObject({
                    code: "GLOBAL_CHAT_MESSAGE_LINK_INVALID",
                })
                await expect(
                    service.sendMessage({
                        user,
                        commandId: " ",
                        body: "hello",
                    }),
                ).rejects.toMatchObject({
                    code: "GLOBAL_CHAT_COMMAND_ID_INVALID",
                })
                await expect(
                    service.toggleReaction({
                        user,
                        commandId: "react",
                        messageId: "message-1",
                        emoji: "",
                    }),
                ).rejects.toMatchObject({
                    code: "GLOBAL_CHAT_REACTION_INVALID",
                })
                await expect(
                    service.report({
                        user,
                        commandId: "report",
                        category: "spam",
                    }),
                ).rejects.toMatchObject({
                    code: "GLOBAL_CHAT_REPORT_TARGET_REQUIRED",
                })
                await expect(
                    service.moderate({
                        user,
                        commandId: "moderate",
                        caseId: "case-1",
                        action: "unknown",
                        reason: "reason",
                        expectedVersion: 1,
                    }),
                ).rejects.toMatchObject({
                    code: "GLOBAL_CHAT_MODERATION_ACTION_INVALID",
                })
            })

        it("returns stable errors for missing room, message and stale writes",
            async () => {
                manager.findOne.mockResolvedValueOnce(null)
                await expect(service.getOrCreateRoom()).rejects.toMatchObject({
                    code: "GLOBAL_CHAT_ROOM_NOT_FOUND",
                })

                manager.findOne.mockImplementation(async (target: { name?: string }) => {
                    if (target.name === "ChatConversationEntity") return room
                    return null
                })
                await expect(
                    service.toggleReaction({
                        user,
                        commandId: "missing-message",
                        messageId: "missing",
                        emoji: reactionEmoji,
                    }),
                ).rejects.toMatchObject({
                    code: "GLOBAL_CHAT_MESSAGE_NOT_FOUND",
                })

                manager.createQueryBuilder.mockImplementation(() =>
                    queryBuilder({
                        execute: jest.fn().mockResolvedValue({
                            affected: 0,
                        }),
                    }),
                )
                manager.findOne.mockImplementation(async (target: { name?: string }) => {
                    if (target.name === "ChatConversationEntity") return room
                    if (target.name === "ChatMessageEntity")
                        return {
                            id: "message-1",
                            isDeleted: false,
                        }
                    return null
                })
                await expect(
                    service.editMessage({
                        user,
                        commandId: "stale-edit",
                        messageId: "message-1",
                        body: "edited",
                        expectedVersion: 1,
                    }),
                ).rejects.toMatchObject({
                    code: "GLOBAL_CHAT_EDIT_VERSION_CONFLICT",
                })
                await expect(
                    service.removeMessage({
                        user,
                        commandId: "stale-remove",
                        messageId: "message-1",
                        expectedVersion: 1,
                    }),
                ).rejects.toMatchObject({
                    code: "GLOBAL_CHAT_REMOVE_VERSION_CONFLICT",
                })
            })

        it("rejects missing reply, read target, report message, and moderation case",
            async () => {
                manager.findOne.mockImplementation(async (target: { name?: string }) =>
                    target.name === "ChatConversationEntity" ? room : null)

                await expect(service.sendMessage({
                    user,
                    commandId: "missing-reply",
                    body: "hello",
                    replyToId: "reply-missing",
                })).rejects.toMatchObject({
                    code: "GLOBAL_CHAT_REPLY_TARGET_INVALID",
                })

                await expect(service.markRead({
                    user,
                    commandId: "missing-read",
                    messageId: "message-missing",
                })).rejects.toMatchObject({
                    code: "GLOBAL_CHAT_MESSAGE_NOT_FOUND",
                })

                await expect(service.report({
                    user,
                    commandId: "missing-report",
                    messageId: "message-missing",
                    category: "spam",
                })).rejects.toMatchObject({
                    code: "GLOBAL_CHAT_MESSAGE_NOT_FOUND",
                })

                await expect(service.moderate({
                    user,
                    commandId: "missing-moderation",
                    caseId: "case-missing",
                    action: "dismiss",
                    reason: "reviewed",
                    expectedVersion: 1,
                })).rejects.toMatchObject({
                    code: "GLOBAL_CHAT_MODERATION_CASE_NOT_FOUND",
                })
                await expect(service.report({
                    user,
                    commandId: "missing-category",
                    reportedUserId: "member-2",
                    category: " ",
                })).rejects.toMatchObject({
                    code: "GLOBAL_CHAT_REPORT_CATEGORY_REQUIRED",
                })

                await expect(service.setNotificationsMuted({
                    user,
                    commandId: "missing-participation",
                    muted: true,
                })).rejects.toMatchObject({
                    code: "GLOBAL_CHAT_PARTICIPATION_NOT_FOUND",
                })
            })

        it("creates a member-only report with no message snapshot",
            async () => {
                manager.findOne
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce(room)
                policy.assertCanRead.mockResolvedValueOnce(null)

                const result = await service.report({
                    user,
                    commandId: "member-report",
                    reportedUserId: "member-2",
                    category: " harassment ",
                    details: "  repeated abuse  ",
                })

                expect(result).toEqual(expect.objectContaining({
                    commandId: "member-report",
                    status: "open",
                    messageId: undefined,
                }))
                const reportPayload = manager.create.mock.calls
                    .map((call) => call[1] as Record<string, unknown>)
                    .find((payload) => payload.category === "harassment")
                expect(reportPayload).toEqual(expect.objectContaining({
                    message: null,
                    reportedUser: {
                        id: "member-2",
                    },
                    reporterHidden: false,
                    details: "repeated abuse",
                }))
            })

        it("passes forward only mentions for other users and deduplicates them",
            async () => {
                manager.findOne
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce(room)
                manager.find.mockResolvedValueOnce([
                    {
                        id: "member-2",
                    },
                    {
                        id: "member-3",
                    },
                ])
                const result = await service.sendMessage({
                    user,
                    commandId: "mention-message",
                    body: "hello",
                    mentionUserIds: [user.id,
                        "member-2",
                        "member-2",
                        "member-3"],
                })

                expect(result.messageId).toBe("message-1")
                expect(manager.find).toHaveBeenCalled()
                expect(manager.save).toHaveBeenCalledTimes(4)
            })

        it("adds a new reaction and applies remove then restore moderation outcomes",
            async () => {
                const moderationCase = {
                    id: "case-1",
                    status: "open",
                    outcome: null,
                    reason: null,
                    version: 1,
                    report: {
                        id: "report-1",
                        status: "open",
                        messageId: "message-1",
                        reportedUserId: "member-2",
                        message: {
                            id: "message-1",
                            authorId: "member-2",
                        },
                    },
                }
                const participation = {
                    accessState: "banned",
                    mutedUntil: null,
                }
                manager.findOne.mockImplementation(async (target: { name?: string }) => {
                    if (target.name === "ChatConversationEntity") return room
                    if (target.name === "ChatMessageEntity")
                        return {
                            id: "message-1",
                            isDeleted: false,
                        }
                    if (target.name === "ChatModerationCaseEntity") return moderationCase
                    if (target.name === "ChatParticipationEntity") return participation
                    return null
                })

                await expect(
                    service.toggleReaction({
                        user,
                        commandId: "reaction-add",
                        messageId: "message-1",
                        emoji: reactionEmoji,
                    }),
                ).resolves.toEqual(
                    expect.objectContaining({
                        active: true,
                    }),
                )

                await expect(
                    service.moderate({
                        user,
                        commandId: "moderation-remove",
                        caseId: "case-1",
                        action: "remove",
                        reason: "policy violation",
                        expectedVersion: 1,
                    }),
                ).resolves.toEqual(
                    expect.objectContaining({
                        status: "actioned",
                    }),
                )
                expect(manager.update).toHaveBeenCalledWith(
                    expect.anything(),
                    {
                        id: "message-1",
                    },
                    expect.objectContaining({
                        isDeleted: true,
                        removedByModerator: true,
                    }),
                )

                await expect(
                    service.moderate({
                        user,
                        commandId: "moderation-restore",
                        caseId: "case-1",
                        action: "restore",
                        reason: "appeal accepted",
                        expectedVersion: 2,
                    }),
                ).resolves.toEqual(
                    expect.objectContaining({
                        version: 3,
                    }),
                )
                expect(manager.update).toHaveBeenCalledWith(
                    expect.anything(),
                    {
                        id: "message-1",
                    },
                    expect.objectContaining({
                        isDeleted: false,
                        removedByModerator: false,
                    }),
                )
                expect(participation.accessState).toBe("active")
            })

        it("recovers an idempotent result when another transaction wins the receipt race",
            async () => {
                const raced = {
                    commandId: "race-1",
                    conversationId: room.id,
                    messageId: "message-race",
                }
                manager.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
                    commandType: "send-message",
                    response: raced,
                })
                manager.transaction.mockRejectedValueOnce(new Error("duplicate receipt"))

                await expect(
                    service.sendMessage({
                        user,
                        commandId: "race-1",
                        body: "hello",
                    }),
                ).resolves.toEqual(raced)
                expect(metrics.snapshot()).toEqual(
                    expect.objectContaining({
                        replayedCommands: 1,
                    }),
                )
            })

        it("applies a valid history cursor and ignores structurally invalid cursor payloads",
            async () => {
                const validCursor = Buffer.from(
                    JSON.stringify({
                        createdAt: "2026-08-25T12:00:00.000Z",
                        id: "message-1",
                    }),
                ).toString("base64url")
                const invalidCursor = Buffer.from(
                    JSON.stringify({
                        createdAt: "invalid",
                        id: "message-1",
                    }),
                ).toString("base64url")
                const validHistory = queryBuilder()
                const invalidHistory = queryBuilder()
                manager.createQueryBuilder
                    .mockReturnValueOnce(queryBuilder() as never)
                    .mockReturnValueOnce(validHistory as never)
                    .mockReturnValueOnce(queryBuilder() as never)
                    .mockReturnValueOnce(invalidHistory as never)
                manager.findOne.mockResolvedValueOnce(room).mockResolvedValueOnce(room)

                await service.listMessages({
                    user,
                    cursor: validCursor,
                })
                await service.listMessages({
                    user,
                    cursor: invalidCursor,
                })

                expect(validHistory.andWhere).toHaveBeenCalledWith(
                    "(message.created_at, message.id) < (:createdAt, :id)",
                    expect.objectContaining({
                        id: "message-1",
                    }),
                )
                expect(invalidHistory.andWhere).not.toHaveBeenCalledWith(
                    "(message.created_at, message.id) < (:createdAt, :id)",
                    expect.anything(),
                )
            })

        it("rejects a missing global room after the idempotent initialization attempt",
            async () => {
                manager.findOne.mockResolvedValueOnce(null)

                await expect(service.getOrCreateRoom()).rejects.toMatchObject({
                    code: "GLOBAL_CHAT_ROOM_NOT_FOUND",
                })
                expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1)
            })
    })

describe("GlobalChatPolicyService",
    () => {
        const membership = {
            isActive: jest.fn().mockResolvedValue(true),
        }

        beforeEach(() => membership.isActive.mockResolvedValue(true))

        it("blocks a banned participant from both reads and socket subscriptions",
            async () => {
                const manager = {
                    findOne: jest.fn().mockResolvedValue({
                        accessState: "banned",
                    }),
                }
                const policy = new GlobalChatPolicyService(
      manager as unknown as EntityManager,
      membership as never,
                )

                await expect(
                    policy.assertCanRead({
                        conversationId: room.id,
                        user,
                    }),
                ).rejects.toMatchObject({
                    code: "CHAT_FORBIDDEN_EXCEPTION",
                })
            })

        it("expires a bounded mute before allowing a new command",
            async () => {
                const participation = {
                    accessState: "muted",
                    mutedUntil: new Date(Date.now() - 1000),
                }
                const manager = {
                    findOne: jest.fn().mockResolvedValue(participation),
                    save: jest.fn().mockResolvedValue(participation),
                }
                const policy = new GlobalChatPolicyService(
      manager as unknown as EntityManager,
      membership as never,
                )

                await expect(
                    policy.assertCanWrite({
                        conversationId: room.id,
                        user,
                    }),
                ).resolves.toBe(participation)
                expect(participation).toEqual({
                    accessState: "active",
                    mutedUntil: null,
                })
                expect(manager.save).toHaveBeenCalledWith(participation)
            })

        it("rejects inactive members and active mutes",
            async () => {
                membership.isActive.mockResolvedValueOnce(false)
                const manager = {
                    findOne: jest.fn(),
                }
                const policy = new GlobalChatPolicyService(
      manager as unknown as EntityManager,
      membership as never,
                )

                await expect(
                    policy.assertCanRead({
                        conversationId: room.id,
                        user,
                    }),
                ).rejects.toMatchObject({
                    code: "CHAT_MEMBERSHIP_REQUIRED_EXCEPTION",
                })

                membership.isActive.mockResolvedValueOnce(true)
                manager.findOne.mockResolvedValueOnce({
                    accessState: "muted",
                    mutedUntil: null,
                })
                await expect(
                    policy.assertCanWrite({
                        conversationId: room.id,
                        user,
                    }),
                ).rejects.toMatchObject({
                    code: "CHAT_FORBIDDEN_EXCEPTION",
                })
            })

        it("allows moderators and rejects ordinary members",
            async () => {
                const manager = {
                    findOne: jest
                        .fn()
                        .mockResolvedValueOnce({
                            role: "moderator",
                            accessState: "active",
                        })
                        .mockResolvedValueOnce({
                            role: "member",
                            accessState: "active",
                        }),
                }
                const policy = new GlobalChatPolicyService(
      manager as unknown as EntityManager,
      membership as never,
                )

                await expect(
                    policy.assertModerator({
                        conversationId: room.id,
                        user,
                    }),
                ).resolves.toEqual(
                    expect.objectContaining({
                        role: "moderator",
                    }),
                )
                await expect(
                    policy.assertModerator({
                        conversationId: room.id,
                        user,
                    }),
                ).rejects.toMatchObject({
                    code: "CHAT_FORBIDDEN_EXCEPTION",
                })
            })
    })

describe("Global Chat GraphQL boundaries",
    () => {
        it("maps every mutation request to the canonical domain service",
            async () => {
                const result = {
                    commandId: "command-1",
                    conversationId: room.id,
                }
                const domain = {
                    sendMessage: jest.fn().mockResolvedValue(result),
                    toggleReaction: jest.fn().mockResolvedValue(result),
                    editMessage: jest.fn().mockResolvedValue(result),
                    removeMessage: jest.fn().mockResolvedValue(result),
                    markRead: jest.fn().mockResolvedValue(result),
                    report: jest.fn().mockResolvedValue(result),
                    moderate: jest.fn().mockResolvedValue(result),
                    roomState: jest.fn().mockResolvedValue({
                        conversationId: room.id,
                    }),
                    setRole: jest.fn().mockResolvedValue({
                        role: "moderator",
                    }),
                    setNotificationsMuted: jest.fn().mockResolvedValue(result),
                }
                const adapter = new GlobalChatMutationService(domain as never)
                const resolver = new GlobalChatMutationResolver(adapter)
                const requests = {
                    send: {
                        clientCommandId: "send",
                        body: "hello",
                    },
                    react: {
                        clientCommandId: "react",
                        messageId: "message-1",
                        emoji: reactionEmoji,
                    },
                    edit: {
                        clientCommandId: "edit",
                        messageId: "message-1",
                        body: "edited",
                        expectedVersion: 1,
                    },
                    remove: {
                        clientCommandId: "remove",
                        messageId: "message-1",
                        expectedVersion: 2,
                    },
                    markRead: {
                        clientCommandId: "read",
                        messageId: "message-1",
                    },
                    report: {
                        clientCommandId: "report",
                        messageId: "message-1",
                        category: "spam",
                    },
                    moderate: {
                        clientCommandId: "moderate",
                        caseId: "case-1",
                        action: "dismiss",
                        reason: "safe",
                        expectedVersion: 1,
                    },
                    setRole: {
                        clientCommandId: "role",
                        targetUserId: "member-2",
                        role: "moderator" as const,
                    },
                    notifications: {
                        clientCommandId: "notifications",
                        muted: true,
                    },
                }

                await expect(resolver.send(requests.send,
                    user)).resolves.toEqual(result)
                await expect(resolver.react(requests.react,
                    user)).resolves.toEqual(result)
                await expect(resolver.edit(requests.edit,
                    user)).resolves.toEqual(result)
                await expect(resolver.remove(requests.remove,
                    user)).resolves.toEqual(
                    result,
                )
                await expect(resolver.markRead(requests.markRead,
                    user)).resolves.toEqual(
                    result,
                )
                await expect(resolver.report(requests.report,
                    user)).resolves.toEqual(
                    result,
                )
                await expect(resolver.moderate(requests.moderate,
                    user)).resolves.toEqual(
                    result,
                )
                await expect(resolver.setRole(requests.setRole,
                    user)).resolves.toEqual({
                    commandId: "role",
                    conversationId: room.id,
                    status: "moderator",
                })
                await expect(
                    resolver.notifications(requests.notifications,
                        user),
                ).resolves.toEqual(result)
                expect(domain.setRole).toHaveBeenCalledWith({
                    actor: user,
                    targetUserId: "member-2",
                    role: "moderator",
                })
            })

        it("maps room, history and confidential evidence queries",
            async () => {
                const domain = {
                    roomState: jest.fn().mockResolvedValue({
                        conversationId: room.id,
                    }),
                    listMessages: jest.fn().mockResolvedValue({
                        items: [],
                        nextCursor: null,
                    }),
                    moderationQueue: jest.fn().mockResolvedValue([
                        {
                            id: "case-1",
                            evidence: {
                                messageBody: "captured",
                            },
                        },
                    ]),
                }
                const adapter = new GlobalChatQueryService(domain as never)
                const resolver = new GlobalChatResolver(adapter)

                await expect(resolver.room(user)).resolves.toEqual({
                    conversationId: room.id,
                })
                await expect(
                    resolver.messages(
                        {
                            cursor: "cursor",
                            limit: 20,
                        },
                        user,
                    ),
                ).resolves.toEqual({
                    items: [],
                    nextCursor: null,
                })
                await expect(
                    resolver.moderationQueue(
                        {
                            status: "open",
                            limit: 10,
                        },
                        user,
                    ),
                ).resolves.toEqual({
                    items: [
                        {
                            id: "case-1",
                            evidence: {
                                messageBody: "captured",
                            },
                            evidenceJson: "{\"messageBody\":\"captured\"}",
                        },
                    ],
                })
            })
    })

describe("Global Chat operational boundaries",
    () => {
        it("tracks accepted, replayed, published and failed outbox work",
            () => {
                const metrics = new GlobalChatMetricsService()
                metrics.commandAccepted()
                metrics.commandReplayed()
                metrics.outboxPublished(42)
                metrics.outboxFailed()
                metrics.logOutboxFailure()

                expect(metrics.snapshot()).toEqual({
                    acceptedCommands: 1,
                    replayedCommands: 1,
                    outboxFailures: 2,
                    lastOutboxLagMs: 42,
                })
            })

        it("runs additive migration and reverse-order rollback statements",
            async () => {
                const queryRunner = {
                    query: jest.fn().mockResolvedValue(undefined),
                }
                const migration = new AddGlobalChatRelationalOutbox1787700000000()

                await migration.up(queryRunner as never)
                const upCalls = queryRunner.query.mock.calls.length
                await migration.down(queryRunner as never)

                expect(upCalls).toBeGreaterThan(10)
                expect(queryRunner.query.mock.calls.length).toBeGreaterThan(upCalls)
                expect(queryRunner.query).toHaveBeenCalledWith(
                    expect.stringContaining("chat_outbox"),
                )
                expect(migration.name).toBe("AddGlobalChatRelationalOutbox1787700000000")
            })
    })
