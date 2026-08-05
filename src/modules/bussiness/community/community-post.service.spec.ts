import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    CommunityPostService,
} from "./community-post.service"
import {
    CommunityPostQuotaService,
} from "./community-post-quota.service"
import {
    CommunityChannel,
} from "@modules/databases"
import type {
    UserEntity,
} from "@modules/databases"
import {
    CommunityPostForbiddenException,
    CommunityPostNotFoundException,
} from "@modules/exceptions"
import {
    EventEmitterService,
    EventName,
} from "@modules/event"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

// the founder gate reads envConfig().community.founderUsername, whose default
// (unmocked here) is "starci183" -- see src/modules/env/config.ts
const FOUNDER_USERNAME = "starci183"

describe("CommunityPostService",
    () => {
        let module: TestingModule
        let service: CommunityPostService
        let entityManager: EntityManagerMock
        let eventEmitterService: jest.Mocked<Pick<EventEmitterService, "emit">>
        let communityPostQuotaService: jest.Mocked<Pick<CommunityPostQuotaService, "assertCanCreatePost">>

        const postId = "post-1"
        const author = {
            id: "user-1",
            username: "regular-user",
        } as unknown as UserEntity
        const founder = {
            id: "founder-1",
            username: FOUNDER_USERNAME,
        } as unknown as UserEntity

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()

            // event bus stub -- every mutation fans out a room event
            eventEmitterService = {
                emit: jest.fn().mockResolvedValue(undefined),
            } as unknown as jest.Mocked<Pick<EventEmitterService, "emit">>

            // quota gate stub -- default allows creation; a test can reject it
            communityPostQuotaService = {
                assertCanCreatePost: jest.fn().mockResolvedValue(undefined),
            } as unknown as jest.Mocked<Pick<CommunityPostQuotaService, "assertCanCreatePost">>

            module = await Test.createTestingModule({
                providers: [
                    CommunityPostService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: EventEmitterService,
                        useValue: eventEmitterService,
                    },
                    {
                        provide: CommunityPostQuotaService,
                        useValue: communityPostQuotaService,
                    },
                ],
            }).compile()

            service = module.get<CommunityPostService>(CommunityPostService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("getPostOrThrow",
            () => {
                it("throws CommunityPostNotFoundException when the row is missing",
                    async () => {
                        // findOne default resolves null -> no such post
                        await expect(
                            service.getPostOrThrow(postId),
                        ).rejects.toBeInstanceOf(CommunityPostNotFoundException)
                    })
            })

        describe("createPost",
            () => {
                it("checks the post quota before writing anything",
                    async () => {
                        entityManager.save.mockResolvedValueOnce({
                            id: postId,
                        })
                        entityManager.findOne.mockResolvedValueOnce({
                            id: postId,
                        })

                        await service.createPost({
                            user: author,
                            channel: CommunityChannel.General,
                            body: "hello",
                        })

                        expect(communityPostQuotaService.assertCanCreatePost).toHaveBeenCalledWith({
                            userId: author.id,
                        })
                    })

                it("does not persist when the quota gate rejects the author",
                    async () => {
                        const quotaError = new Error("quota exceeded")
                        communityPostQuotaService.assertCanCreatePost.mockRejectedValueOnce(quotaError)

                        await expect(
                            service.createPost({
                                user: author,
                                channel: CommunityChannel.General,
                                body: "hello",
                            }),
                        ).rejects.toBe(quotaError)

                        expect(entityManager.save).not.toHaveBeenCalled()
                        expect(eventEmitterService.emit).not.toHaveBeenCalled()
                    })

                it("persists the post and emits CommunityPostCreated",
                    async () => {
                        entityManager.save.mockResolvedValueOnce({
                            id: postId,
                        })
                        const reloaded = {
                            id: postId,
                            channel: CommunityChannel.General,
                        }
                        entityManager.findOne.mockResolvedValueOnce(reloaded)

                        const result = await service.createPost({
                            user: author,
                            channel: CommunityChannel.General,
                            body: "hello",
                        })

                        expect(result).toBe(reloaded)
                        expect(eventEmitterService.emit).toHaveBeenCalledWith({
                            event: EventName.CommunityPostCreated,
                            payload: {
                                postId,
                                channel: CommunityChannel.General,
                            },
                        })
                    })
            })

        describe("updatePost",
            () => {
                it("edits the body, stamps editedAt, and emits CommunityPostUpdated when the author matches",
                    async () => {
                        const post = {
                            id: postId,
                            authorId: author.id,
                            channel: CommunityChannel.General,
                            body: "old",
                            editedAt: null as Date | null,
                        }
                        entityManager.findOne.mockResolvedValueOnce(post)

                        const result = await service.updatePost({
                            postId,
                            body: "new",
                            user: author,
                        })

                        expect(result.body).toBe("new")
                        expect(post.editedAt).toBeInstanceOf(Date)
                        expect(eventEmitterService.emit).toHaveBeenCalledWith({
                            event: EventName.CommunityPostUpdated,
                            payload: {
                                postId,
                                channel: CommunityChannel.General,
                            },
                        })
                    })

                it("rejects an edit from a non-author with CommunityPostForbiddenException",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: postId,
                            // owned by someone else
                            authorId: "other-user",
                        })

                        await expect(
                            service.updatePost({
                                postId,
                                body: "new",
                                user: author,
                            }),
                        ).rejects.toBeInstanceOf(CommunityPostForbiddenException)
                        // ownership guard fires BEFORE any mutation is persisted or fanned out
                        expect(entityManager.save).not.toHaveBeenCalled()
                        expect(eventEmitterService.emit).not.toHaveBeenCalled()
                    })
            })

        describe("softDeletePost",
            () => {
                it("flags the post deleted and emits CommunityPostDeleted when the author matches",
                    async () => {
                        const post = {
                            id: postId,
                            authorId: author.id,
                            channel: CommunityChannel.General,
                            isDeleted: false,
                        }
                        entityManager.findOne.mockResolvedValueOnce(post)

                        const result = await service.softDeletePost({
                            postId,
                            user: author,
                        })

                        expect(result).toEqual({
                            id: postId,
                        })
                        // soft delete keeps the row + comment thread but marks it removed
                        expect(post.isDeleted).toBe(true)
                        expect(eventEmitterService.emit).toHaveBeenCalledWith({
                            event: EventName.CommunityPostDeleted,
                            payload: {
                                postId,
                                channel: CommunityChannel.General,
                            },
                        })
                    })

                it("rejects a delete from a non-author with CommunityPostForbiddenException",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: postId,
                            authorId: "other-user",
                            isDeleted: false,
                        })

                        await expect(
                            service.softDeletePost({
                                postId,
                                user: author,
                            }),
                        ).rejects.toBeInstanceOf(CommunityPostForbiddenException)
                        expect(entityManager.save).not.toHaveBeenCalled()
                        expect(eventEmitterService.emit).not.toHaveBeenCalled()
                    })
            })

        describe("setPinned (founder-only gate)",
            () => {
                it("rejects a non-founder even when they own the post, with CommunityPostForbiddenException",
                    async () => {
                        await expect(
                            service.setPinned({
                                postId,
                                pinned: true,
                                // the AUTHOR themself, still not the founder -- a forged call must
                                // still fail even from the post's own owner
                                user: author,
                            }),
                        ).rejects.toBeInstanceOf(CommunityPostForbiddenException)
                        // the gate rejects before ever loading the post row
                        expect(entityManager.findOne).not.toHaveBeenCalled()
                        expect(entityManager.save).not.toHaveBeenCalled()
                        expect(eventEmitterService.emit).not.toHaveBeenCalled()
                    })

                it("pins the post and emits CommunityPostUpdated for the founder",
                    async () => {
                        const post = {
                            id: postId,
                            channel: CommunityChannel.General,
                            isPinned: false,
                        }
                        entityManager.findOne.mockResolvedValueOnce(post)

                        const result = await service.setPinned({
                            postId,
                            pinned: true,
                            user: founder,
                        })

                        expect(result.isPinned).toBe(true)
                        expect(eventEmitterService.emit).toHaveBeenCalledWith({
                            event: EventName.CommunityPostUpdated,
                            payload: {
                                postId,
                                channel: CommunityChannel.General,
                            },
                        })
                    })

                it("unpins the post for the founder",
                    async () => {
                        const post = {
                            id: postId,
                            channel: CommunityChannel.General,
                            isPinned: true,
                        }
                        entityManager.findOne.mockResolvedValueOnce(post)

                        const result = await service.setPinned({
                            postId,
                            pinned: false,
                            user: founder,
                        })

                        expect(result.isPinned).toBe(false)
                    })

                it("still 404s for the founder when the post does not exist",
                    async () => {
                        // founder passes the username gate, but the post itself is missing
                        await expect(
                            service.setPinned({
                                postId,
                                pinned: true,
                                user: founder,
                            }),
                        ).rejects.toBeInstanceOf(CommunityPostNotFoundException)
                    })
            })

        describe("listFeed",
            () => {
                it("scopes to a channel when one is given",
                    async () => {
                        entityManager.findAndCount.mockResolvedValueOnce([
                            [],
                            0,
                        ])

                        await service.listFeed({
                            channel: CommunityChannel.General,
                            offset: 0,
                            limit: 20,
                        })

                        const options = entityManager.findAndCount.mock.calls[0][1] as {
                            where: {
                                channel?: CommunityChannel
                                isDeleted: boolean
                            }
                        }
                        expect(options.where.channel).toBe(CommunityChannel.General)
                        // soft-deleted posts never surface in the feed
                        expect(options.where.isDeleted).toBe(false)
                    })

                it("omits the channel filter entirely when none is given",
                    async () => {
                        entityManager.findAndCount.mockResolvedValueOnce([
                            [],
                            0,
                        ])

                        await service.listFeed({
                            offset: 0,
                            limit: 20,
                        })

                        const options = entityManager.findAndCount.mock.calls[0][1] as {
                            where: {
                                channel?: CommunityChannel
                            }
                        }
                        expect(options.where.channel).toBeUndefined()
                    })

                it("orders pinned-first, then newest",
                    async () => {
                        entityManager.findAndCount.mockResolvedValueOnce([
                            [],
                            0,
                        ])

                        await service.listFeed({
                            offset: 0,
                            limit: 20,
                        })

                        const options = entityManager.findAndCount.mock.calls[0][1] as {
                            order: {
                                isPinned: string
                                createdAt: string
                            }
                        }
                        expect(options.order).toEqual({
                            isPinned: "DESC",
                            createdAt: "DESC",
                        })
                    })
            })
    })
