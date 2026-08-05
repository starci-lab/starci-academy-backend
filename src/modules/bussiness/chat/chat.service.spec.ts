import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    ChatService,
} from "./chat.service"
import {
    ChatConversationType,
} from "@modules/databases/postgresql/primary/enums/chat-conversation-type"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    ChatConversationNotFoundException,
    ChatForbiddenException,
    ChatMembershipRequiredException,
} from "@modules/platform/exceptions/errors/community/chat"
import {
    EventName,
} from "@modules/platform/event/enums/event-name"
import {
    EventEmitterService,
} from "@modules/platform/event/event-emitter.service"
import {
    MembershipService,
} from "@modules/membership/membership.service"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

// the founder DM gate reads envConfig().community.founderUsername, whose
// default (unmocked here) is "starci183" -- see src/modules/env/config.ts
const FOUNDER_USERNAME = "starci183"

describe("ChatService",
    () => {
        let module: TestingModule
        let service: ChatService
        let entityManager: EntityManagerMock
        let eventEmitterService: jest.Mocked<Pick<EventEmitterService, "emit">>
        let membershipService: jest.Mocked<Pick<MembershipService, "isActive">>

        const conversationId = "conversation-1"
        const member = {
            id: "member-1",
            username: "regular-member",
        } as unknown as UserEntity
        const otherMember = {
            id: "member-2",
            username: "other-member",
        } as unknown as UserEntity
        const founder = {
            id: "founder-1",
            username: FOUNDER_USERNAME,
        } as unknown as UserEntity

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()

            // event bus stub -- every sent message fans out a room event
            eventEmitterService = {
                emit: jest.fn().mockResolvedValue(undefined),
            } as unknown as jest.Mocked<Pick<EventEmitterService, "emit">>

            // membership gate stub -- chat is member-only; default to an active member
            // so each access-check test only has to override what it cares about
            membershipService = {
                isActive: jest.fn().mockResolvedValue(true),
            } as unknown as jest.Mocked<Pick<MembershipService, "isActive">>

            module = await Test.createTestingModule({
                providers: [
                    ChatService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: EventEmitterService,
                        useValue: eventEmitterService,
                    },
                    {
                        provide: MembershipService,
                        useValue: membershipService,
                    },
                ],
            }).compile()

            service = module.get<ChatService>(ChatService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("getOrCreateCommunityConversation",
            () => {
                it("returns the existing community room without creating a new one",
                    async () => {
                        const existing = {
                            id: conversationId,
                            type: ChatConversationType.Community,
                        }
                        entityManager.findOne.mockResolvedValueOnce(existing)

                        const result = await service.getOrCreateCommunityConversation()

                        expect(result).toBe(existing)
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })

                it("creates the singleton community room on first access",
                    async () => {
                        // findOne default resolves null -> nothing exists yet
                        await service.getOrCreateCommunityConversation()

                        expect(entityManager.create).toHaveBeenCalledWith(
                            expect.anything(),
                            expect.objectContaining({
                                type: ChatConversationType.Community,
                                member: null,
                            }),
                        )
                        expect(entityManager.save).toHaveBeenCalledTimes(1)
                    })
            })

        describe("getOrCreateFounderDm",
            () => {
                it("returns the member's existing DM thread without creating a new one",
                    async () => {
                        const existing = {
                            id: conversationId,
                            type: ChatConversationType.FounderDm,
                        }
                        entityManager.findOne.mockResolvedValueOnce(existing)

                        const result = await service.getOrCreateFounderDm({
                            memberId: member.id,
                        })

                        expect(result).toBe(existing)
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })

                it("creates the member's DM thread on first access",
                    async () => {
                        await service.getOrCreateFounderDm({
                            memberId: member.id,
                        })

                        expect(entityManager.create).toHaveBeenCalledWith(
                            expect.anything(),
                            expect.objectContaining({
                                type: ChatConversationType.FounderDm,
                                member: {
                                    id: member.id,
                                },
                            }),
                        )
                        expect(entityManager.save).toHaveBeenCalledTimes(1)
                    })
            })

        describe("getConversationOrThrow",
            () => {
                it("throws ChatConversationNotFoundException when the row is missing",
                    async () => {
                        await expect(
                            service.getConversationOrThrow(conversationId),
                        ).rejects.toBeInstanceOf(ChatConversationNotFoundException)
                    })
            })

        describe("access checks (via listMessages / sendMessage)",
            () => {
                describe("membership gate",
                    () => {
                        it("blocks a non-member from listing the community room",
                            async () => {
                                entityManager.findOne.mockResolvedValueOnce({
                                    id: conversationId,
                                    type: ChatConversationType.Community,
                                })
                                membershipService.isActive.mockResolvedValueOnce(false)

                                await expect(
                                    service.listMessages({
                                        conversationId,
                                        user: member,
                                        offset: 0,
                                        limit: 20,
                                    }),
                                ).rejects.toBeInstanceOf(ChatMembershipRequiredException)
                                expect(entityManager.findAndCount).not.toHaveBeenCalled()
                            })

                        it("blocks a non-member from sending to the community room",
                            async () => {
                                entityManager.findOne.mockResolvedValueOnce({
                                    id: conversationId,
                                    type: ChatConversationType.Community,
                                })
                                membershipService.isActive.mockResolvedValueOnce(false)

                                await expect(
                                    service.sendMessage({
                                        conversationId,
                                        body: "hi",
                                        user: member,
                                    }),
                                ).rejects.toBeInstanceOf(ChatMembershipRequiredException)
                                expect(entityManager.save).not.toHaveBeenCalled()
                                expect(eventEmitterService.emit).not.toHaveBeenCalled()
                            })

                        it("allows an active member to read/send in the community room",
                            async () => {
                                entityManager.findOne.mockResolvedValueOnce({
                                    id: conversationId,
                                    type: ChatConversationType.Community,
                                })
                                entityManager.findAndCount.mockResolvedValueOnce([
                                    [],
                                    0,
                                ])

                                await expect(
                                    service.listMessages({
                                        conversationId,
                                        user: member,
                                        offset: 0,
                                        limit: 20,
                                    }),
                                ).resolves.toEqual({
                                    messages: [],
                                    total: 0,
                                })
                            })
                    })

                describe("founder-DM privacy gate",
                    () => {
                        it("allows the DM's own owning member to read it",
                            async () => {
                                entityManager.findOne.mockResolvedValueOnce({
                                    id: conversationId,
                                    type: ChatConversationType.FounderDm,
                                    memberId: member.id,
                                })
                                entityManager.findAndCount.mockResolvedValueOnce([
                                    [],
                                    0,
                                ])

                                await expect(
                                    service.listMessages({
                                        conversationId,
                                        user: member,
                                        offset: 0,
                                        limit: 20,
                                    }),
                                ).resolves.toEqual({
                                    messages: [],
                                    total: 0,
                                })
                            })

                        it("allows the founder to read a member's DM",
                            async () => {
                                entityManager.findOne.mockResolvedValueOnce({
                                    id: conversationId,
                                    type: ChatConversationType.FounderDm,
                                    memberId: member.id,
                                })
                                entityManager.findAndCount.mockResolvedValueOnce([
                                    [],
                                    0,
                                ])

                                await expect(
                                    service.listMessages({
                                        conversationId,
                                        // the founder is neither the DM's member nor themself
                                        // stored as memberId -- the username check must admit them
                                        user: founder,
                                        offset: 0,
                                        limit: 20,
                                    }),
                                ).resolves.toEqual({
                                    messages: [],
                                    total: 0,
                                })
                            })

                        it("rejects a THIRD member — neither the DM owner nor the founder — from reading it",
                            async () => {
                                entityManager.findOne.mockResolvedValueOnce({
                                    id: conversationId,
                                    type: ChatConversationType.FounderDm,
                                    memberId: member.id,
                                })

                                await expect(
                                    service.listMessages({
                                        conversationId,
                                        // an unrelated active member -- not the DM's owner, not
                                        // the founder -- this is the core private-DM leak to catch
                                        user: otherMember,
                                        offset: 0,
                                        limit: 20,
                                    }),
                                ).rejects.toBeInstanceOf(ChatForbiddenException)
                                expect(entityManager.findAndCount).not.toHaveBeenCalled()
                            })

                        it("rejects a THIRD member from sending into someone else's founder DM",
                            async () => {
                                entityManager.findOne.mockResolvedValueOnce({
                                    id: conversationId,
                                    type: ChatConversationType.FounderDm,
                                    memberId: member.id,
                                })

                                await expect(
                                    service.sendMessage({
                                        conversationId,
                                        body: "sneaking in",
                                        user: otherMember,
                                    }),
                                ).rejects.toBeInstanceOf(ChatForbiddenException)
                                expect(entityManager.save).not.toHaveBeenCalled()
                                expect(eventEmitterService.emit).not.toHaveBeenCalled()
                            })

                        it("still requires an active membership even for the DM's own owner",
                            async () => {
                                entityManager.findOne.mockResolvedValueOnce({
                                    id: conversationId,
                                    type: ChatConversationType.FounderDm,
                                    memberId: member.id,
                                })
                                // membership lapsed since the DM was created
                                membershipService.isActive.mockResolvedValueOnce(false)

                                await expect(
                                    service.listMessages({
                                        conversationId,
                                        user: member,
                                        offset: 0,
                                        limit: 20,
                                    }),
                                ).rejects.toBeInstanceOf(ChatMembershipRequiredException)
                            })
                    })
            })

        describe("sendMessage",
            () => {
                it("persists the message and emits ChatMessageCreated",
                    async () => {
                        entityManager.findOne
                            // getConversationOrThrow
                            .mockResolvedValueOnce({
                                id: conversationId,
                                type: ChatConversationType.Community,
                            })
                        entityManager.save.mockResolvedValueOnce({
                            id: "message-1",
                        })
                        const reloaded = {
                            id: "message-1",
                            body: "hi",
                        }
                        entityManager.findOne
                            // reload-after-save
                            .mockResolvedValueOnce(reloaded)

                        const result = await service.sendMessage({
                            conversationId,
                            body: "hi",
                            user: member,
                        })

                        expect(result).toBe(reloaded)
                        expect(eventEmitterService.emit).toHaveBeenCalledWith({
                            event: EventName.ChatMessageCreated,
                            payload: {
                                conversationId,
                                messageId: "message-1",
                                authorId: member.id,
                            },
                        })
                    })

                it("falls back to the just-saved row if the reload race returns nothing",
                    async () => {
                        entityManager.findOne
                            // getConversationOrThrow
                            .mockResolvedValueOnce({
                                id: conversationId,
                                type: ChatConversationType.Community,
                            })
                        const saved = {
                            id: "message-1",
                        }
                        entityManager.save.mockResolvedValueOnce(saved)
                        // reload-after-save unexpectedly misses
                        entityManager.findOne.mockResolvedValueOnce(null)

                        const result = await service.sendMessage({
                            conversationId,
                            body: "hi",
                            user: member,
                        })

                        expect(result).toBe(saved)
                    })
            })
    })
