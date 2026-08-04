import {
    Test,
} from "@nestjs/testing"
import type {
    INestApplication,
} from "@nestjs/common"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    CommunityChannel,
    CommunityPostCommentEntity,
    CommunityPostCommentReactionEntity,
    CommunityPostEntity,
    CommunityPostReactionEntity,
    MembershipEntity,
    MembershipStatus,
    PrimaryPostgreSQLModule,
    ReactionType,
    UserEntity,
} from "@modules/databases"
import {
    CommunityPostCommentForbiddenException,
    CommunityPostCommentNotFoundException,
    CommunityPostForbiddenException,
    CommunityPostNotFoundException,
    CommunityPostQuotaExceededException,
} from "@modules/exceptions"
import {
    DayjsService,
} from "@modules/mixin"
import {
    EventEmitterService,
} from "@modules/event"
import {
    MembershipService,
} from "@modules/membership"
import {
    CommunityCommentService,
    CommunityPostQuotaService,
    CommunityPostService,
    CommunityReactionService,
    NotificationService,
} from "@modules/bussiness"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Founder username the pin gate reads from `envConfig().community.founderUsername`
 *  (unmocked here — its default, see `src/modules/platform/env/config.ts`). */
const FOUNDER_USERNAME = "starci183"

/** Default non-member post cap + rolling window, also read off the unmocked env default. */
const NON_MEMBER_POST_LIMIT = 3

/**
 * e2e for the community UGC write-flows — `.claude/canon/be/enforce/authoring/testing.md`
 * §2 names "a community post or reaction" explicitly as a write flow that must carry
 * `*.e2e-spec.ts` coverage. Exercises {@link CommunityPostService},
 * {@link CommunityCommentService}, {@link CommunityReactionService}, and
 * {@link CommunityPostQuotaService} against REAL Postgres (Testcontainers) — not the
 * mocked-`EntityManager` unit level already covered by each service's own `.spec.ts`.
 *
 * In focus: the OWNERSHIP guard on post/comment update+delete (the IDOR class — a
 * non-author must never mutate someone else's row), the founder-only pin gate, the
 * non-member post quota (rolling window, deleted rows still count), and soft-delete
 * landing on the real `is_deleted` column rather than removing the row.
 *
 * MOCKED (no external infra available in this harness, genuinely external to the
 * community domain under test):
 *  - `EventEmitterService` — real class fans out to EventEmitter2 + NATS; stubbed so
 *    a mutation's room-broadcast side effect never touches either.
 *  - `NotificationService` — real class writes a notification row AND re-fans-out
 *    through the (mocked) event emitter; stubbed to a bare `createNotification` spy
 *    since reply-notification delivery is a different domain, not this spec's focus.
 *
 * REAL: Postgres (Testcontainers), the four community services above,
 * {@link MembershipService} (the quota's member/non-member branch), and
 * {@link DayjsService} (the quota's rolling-window math).
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Community UGC — posts, comments, reactions, pin gate, quota (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let communityPostService: CommunityPostService
        let communityCommentService: CommunityCommentService
        let communityReactionService: CommunityReactionService

        const eventEmitterServiceMock = {
            emit: jest.fn().mockResolvedValue(undefined),
        }
        const notificationServiceMock = {
            createNotification: jest.fn().mockResolvedValue(undefined),
        }

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    // real Postgres against the Testcontainers DB — no hydration/
                    // resolvers/seeders, this focused app doesn't need them
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                ],
                providers: [
                    // REAL — the post/comment/reaction/quota logic under test
                    CommunityPostService,
                    CommunityCommentService,
                    CommunityReactionService,
                    CommunityPostQuotaService,
                    // REAL — the quota's member/non-member branch + rolling-window math
                    MembershipService,
                    DayjsService,
                    // mocked externals genuinely outside the community domain
                    {
                        provide: EventEmitterService,
                        useValue: eventEmitterServiceMock,
                    },
                    {
                        provide: NotificationService,
                        useValue: notificationServiceMock,
                    },
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            await app.init()

            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            communityPostService = app.get(CommunityPostService)
            communityCommentService = app.get(CommunityCommentService)
            communityReactionService = app.get(CommunityReactionService)
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE \"community_post_comment_reactions\", \"community_post_reactions\", \"community_post_comments\", \"community_posts\", \"memberships\", \"users\" RESTART IDENTITY CASCADE",
            )
            jest.clearAllMocks()
        })

        /** Seed a bare user (only keycloakId + username are required by this suite). */
        const seedUser = async (
            keycloakId: string,
            username: string,
        ): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId,
                        username,
                    }),
            )

        /** Seed an ACTIVE membership (period end 30 days out) so the quota never gates this user. */
        const seedActiveMembership = async (user: UserEntity): Promise<void> => {
            await entityManager.save(
                entityManager.create(MembershipEntity,
                    {
                        user,
                        status: MembershipStatus.Active,
                        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        autoRenew: false,
                    }),
            )
        }

        describe("create/update/delete post — ownership guard is the IDOR class",
            () => {
                it("createPost persists a real row (quota-checked non-member, under the cap)",
                    async () => {
                        const author = await seedUser("kc-post-author",
                            "post-author")

                        const post = await communityPostService.createPost({
                            user: author,
                            channel: CommunityChannel.Problems,
                            body: "hello community",
                        })

                        const row = await entityManager.findOneOrFail(CommunityPostEntity,
                            {
                                where: {
                                    id: post.id,
                                },
                            })
                        expect(row.body).toBe("hello community")
                        expect(row.channel).toBe(CommunityChannel.Problems)
                        expect(row.authorId).toBe(author.id)
                        expect(row.isDeleted).toBe(false)
                        expect(row.isPinned).toBe(false)
                    })

                it("updatePost: the AUTHOR can edit their own post (body + editedAt land on the real row)",
                    async () => {
                        const author = await seedUser("kc-post-editor",
                            "post-editor")
                        const post = await communityPostService.createPost({
                            user: author,
                            channel: CommunityChannel.General,
                            body: "original body",
                        })

                        const updated = await communityPostService.updatePost({
                            postId: post.id,
                            body: "edited body",
                            user: author,
                        })
                        expect(updated.body).toBe("edited body")
                        expect(updated.editedAt).not.toBeNull()

                        const row = await entityManager.findOneOrFail(CommunityPostEntity,
                            {
                                where: {
                                    id: post.id,
                                },
                            })
                        expect(row.body).toBe("edited body")
                    })

                it("updatePost: a NON-author is rejected — CommunityPostForbiddenException, body untouched (IDOR guard)",
                    async () => {
                        const author = await seedUser("kc-post-owner-a",
                            "owner-a")
                        const attacker = await seedUser("kc-post-attacker-a",
                            "attacker-a")
                        const post = await communityPostService.createPost({
                            user: author,
                            channel: CommunityChannel.General,
                            body: "original body",
                        })

                        await expect(
                            communityPostService.updatePost({
                                postId: post.id,
                                body: "hijacked body",
                                user: attacker,
                            }),
                        ).rejects.toBeInstanceOf(CommunityPostForbiddenException)

                        const row = await entityManager.findOneOrFail(CommunityPostEntity,
                            {
                                where: {
                                    id: post.id,
                                },
                            })
                        expect(row.body).toBe("original body")
                        expect(row.editedAt).toBeNull()
                    })

                it("softDeletePost: the AUTHOR can delete — flips is_deleted true on the SAME row (no removal)",
                    async () => {
                        const author = await seedUser("kc-post-deleter",
                            "post-deleter")
                        const post = await communityPostService.createPost({
                            user: author,
                            channel: CommunityChannel.General,
                            body: "to be deleted",
                        })

                        const result = await communityPostService.softDeletePost({
                            postId: post.id,
                            user: author,
                        })
                        expect(result.id).toBe(post.id)

                        // the row still exists — soft delete, not a removal
                        const row = await entityManager.findOneOrFail(CommunityPostEntity,
                            {
                                where: {
                                    id: post.id,
                                },
                            })
                        expect(row.isDeleted).toBe(true)
                    })

                it("softDeletePost: a NON-author is rejected — CommunityPostForbiddenException, is_deleted stays false (IDOR guard)",
                    async () => {
                        const author = await seedUser("kc-post-owner-b",
                            "owner-b")
                        const attacker = await seedUser("kc-post-attacker-b",
                            "attacker-b")
                        const post = await communityPostService.createPost({
                            user: author,
                            channel: CommunityChannel.General,
                            body: "must survive",
                        })

                        await expect(
                            communityPostService.softDeletePost({
                                postId: post.id,
                                user: attacker,
                            }),
                        ).rejects.toBeInstanceOf(CommunityPostForbiddenException)

                        const row = await entityManager.findOneOrFail(CommunityPostEntity,
                            {
                                where: {
                                    id: post.id,
                                },
                            })
                        expect(row.isDeleted).toBe(false)
                    })

                it("softDeletePost excludes the post from listFeed but the row + its comment thread survive",
                    async () => {
                        const author = await seedUser("kc-post-feed",
                            "post-feed")
                        const post = await communityPostService.createPost({
                            user: author,
                            channel: CommunityChannel.General,
                            body: "will be hidden",
                        })
                        await communityCommentService.createComment({
                            postId: post.id,
                            body: "a comment on a soon-deleted post",
                            user: author,
                        })

                        await communityPostService.softDeletePost({
                            postId: post.id,
                            user: author,
                        })

                        const feed = await communityPostService.listFeed({
                            offset: 0,
                            limit: 20,
                        })
                        expect(feed.posts.find((p) => p.id === post.id)).toBeUndefined()

                        // the comment thread shape survives the soft-delete
                        const commentCount = await entityManager.count(CommunityPostCommentEntity,
                            {
                                where: {
                                    post: {
                                        id: post.id,
                                    },
                                },
                            })
                        expect(commentCount).toBe(1)
                    })

                it("getPostOrThrow: a non-existent post id is a hard 404 (CommunityPostNotFoundException)",
                    async () => {
                        await expect(
                            communityPostService.updatePost({
                                postId: "11111111-1111-4111-8111-111111111111",
                                body: "irrelevant",
                                user: await seedUser("kc-post-404",
                                    "post-404"),
                            }),
                        ).rejects.toBeInstanceOf(CommunityPostNotFoundException)
                    })
            })

        describe("create/update/delete post-comment — same ownership guard, threaded",
            () => {
                it("createComment persists a top-level comment, then a REPLY threaded under it",
                    async () => {
                        const author = await seedUser("kc-comment-author",
                            "comment-author")
                        const post = await communityPostService.createPost({
                            user: author,
                            channel: CommunityChannel.General,
                            body: "post to comment on",
                        })

                        const topLevel = await communityCommentService.createComment({
                            postId: post.id,
                            body: "top-level comment",
                            user: author,
                        })
                        expect(topLevel.parentCommentId).toBeNull()

                        const reply = await communityCommentService.createComment({
                            postId: post.id,
                            parentCommentId: topLevel.id,
                            body: "a reply",
                            user: author,
                        })
                        expect(reply.parentCommentId).toBe(topLevel.id)

                        const replyCounts = await communityCommentService.countReplies([
                            topLevel.id,
                        ])
                        expect(replyCounts[topLevel.id]).toBe(1)
                    })

                it("updateComment: the AUTHOR can edit; a NON-author is rejected — CommunityPostCommentForbiddenException, body untouched",
                    async () => {
                        const author = await seedUser("kc-comment-owner-a",
                            "comment-owner-a")
                        const attacker = await seedUser("kc-comment-attacker-a",
                            "comment-attacker-a")
                        const post = await communityPostService.createPost({
                            user: author,
                            channel: CommunityChannel.General,
                            body: "post",
                        })
                        const comment = await communityCommentService.createComment({
                            postId: post.id,
                            body: "original comment",
                            user: author,
                        })

                        const edited = await communityCommentService.updateComment({
                            commentId: comment.id,
                            body: "edited comment",
                            user: author,
                        })
                        expect(edited.body).toBe("edited comment")

                        await expect(
                            communityCommentService.updateComment({
                                commentId: comment.id,
                                body: "hijacked comment",
                                user: attacker,
                            }),
                        ).rejects.toBeInstanceOf(CommunityPostCommentForbiddenException)

                        const row = await entityManager.findOneOrFail(CommunityPostCommentEntity,
                            {
                                where: {
                                    id: comment.id,
                                },
                            })
                        expect(row.body).toBe("edited comment")
                    })

                it("softDeleteComment: the AUTHOR can delete — is_deleted flips true, replies survive; a NON-author is rejected",
                    async () => {
                        const author = await seedUser("kc-comment-owner-b",
                            "comment-owner-b")
                        const attacker = await seedUser("kc-comment-attacker-b",
                            "comment-attacker-b")
                        const post = await communityPostService.createPost({
                            user: author,
                            channel: CommunityChannel.General,
                            body: "post",
                        })
                        const comment = await communityCommentService.createComment({
                            postId: post.id,
                            body: "parent comment",
                            user: author,
                        })
                        await communityCommentService.createComment({
                            postId: post.id,
                            parentCommentId: comment.id,
                            body: "child reply",
                            user: author,
                        })

                        await expect(
                            communityCommentService.softDeleteComment({
                                commentId: comment.id,
                                user: attacker,
                            }),
                        ).rejects.toBeInstanceOf(CommunityPostCommentForbiddenException)

                        const beforeOwnerDelete = await entityManager.findOneOrFail(
                            CommunityPostCommentEntity,
                            {
                                where: {
                                    id: comment.id,
                                },
                            },
                        )
                        expect(beforeOwnerDelete.isDeleted).toBe(false)

                        const result = await communityCommentService.softDeleteComment({
                            commentId: comment.id,
                            user: author,
                        })
                        expect(result.id).toBe(comment.id)

                        const row = await entityManager.findOneOrFail(CommunityPostCommentEntity,
                            {
                                where: {
                                    id: comment.id,
                                },
                            })
                        expect(row.isDeleted).toBe(true)

                        // the reply row still exists — thread shape survives
                        const replyCount = await entityManager.count(CommunityPostCommentEntity,
                            {
                                where: {
                                    parentComment: {
                                        id: comment.id,
                                    },
                                },
                            })
                        expect(replyCount).toBe(1)
                    })

                it("getCommentOrThrow: a non-existent comment id is a hard 404 (CommunityPostCommentNotFoundException)",
                    async () => {
                        const user = await seedUser("kc-comment-404",
                            "comment-404")
                        await expect(
                            communityCommentService.updateComment({
                                commentId: "22222222-2222-4222-8222-222222222222",
                                body: "irrelevant",
                                user,
                            }),
                        ).rejects.toBeInstanceOf(CommunityPostCommentNotFoundException)
                    })
            })

        describe("react-to-post / react-to-post-comment — upsert-by-unique, null removes",
            () => {
                it("reactToPost: first reaction inserts, same user re-reacting UPDATES the SAME row (no duplicate), null removes it",
                    async () => {
                        const author = await seedUser("kc-react-post-author",
                            "react-post-author")
                        const reactor = await seedUser("kc-react-post-user",
                            "react-post-user")
                        const post = await communityPostService.createPost({
                            user: author,
                            channel: CommunityChannel.General,
                            body: "react to me",
                        })

                        const first = await communityReactionService.reactToPost({
                            postId: post.id,
                            user: reactor,
                            type: ReactionType.Like,
                        })
                        expect(first.total).toBe(1)
                        expect(first.myReaction).toBe(ReactionType.Like)

                        const changed = await communityReactionService.reactToPost({
                            postId: post.id,
                            user: reactor,
                            type: ReactionType.Love,
                        })
                        expect(changed.total).toBe(1)
                        expect(changed.myReaction).toBe(ReactionType.Love)

                        const rowCount = await entityManager.count(CommunityPostReactionEntity,
                            {
                                where: {
                                    post: {
                                        id: post.id,
                                    },
                                },
                            })
                        expect(rowCount).toBe(1)

                        const removed = await communityReactionService.reactToPost({
                            postId: post.id,
                            user: reactor,
                            type: null,
                        })
                        expect(removed.total).toBe(0)
                        expect(removed.myReaction).toBeNull()

                        const afterRemove = await entityManager.count(CommunityPostReactionEntity,
                            {
                                where: {
                                    post: {
                                        id: post.id,
                                    },
                                },
                            })
                        expect(afterRemove).toBe(0)
                    })

                it("reactToPost: reacting to a non-existent post is a hard 404 (CommunityPostNotFoundException)",
                    async () => {
                        const reactor = await seedUser("kc-react-post-404",
                            "react-post-404")
                        await expect(
                            communityReactionService.reactToPost({
                                postId: "33333333-3333-4333-8333-333333333333",
                                user: reactor,
                                type: ReactionType.Like,
                            }),
                        ).rejects.toBeInstanceOf(CommunityPostNotFoundException)
                    })

                it("reactToComment: upsert-by-unique on a post comment, real row committed",
                    async () => {
                        const author = await seedUser("kc-react-comment-author",
                            "react-comment-author")
                        const reactor = await seedUser("kc-react-comment-user",
                            "react-comment-user")
                        const post = await communityPostService.createPost({
                            user: author,
                            channel: CommunityChannel.General,
                            body: "post",
                        })
                        const comment = await communityCommentService.createComment({
                            postId: post.id,
                            body: "react to this comment",
                            user: author,
                        })

                        const first = await communityReactionService.reactToComment({
                            commentId: comment.id,
                            user: reactor,
                            type: ReactionType.Haha,
                        })
                        expect(first.total).toBe(1)
                        expect(first.myReaction).toBe(ReactionType.Haha)

                        const rowCount = await entityManager.count(
                            CommunityPostCommentReactionEntity,
                            {
                                where: {
                                    comment: {
                                        id: comment.id,
                                    },
                                },
                            },
                        )
                        expect(rowCount).toBe(1)
                    })
            })

        describe("set-post-pinned — FOUNDER-ONLY gate",
            () => {
                it("the founder (envConfig().community.founderUsername) can pin a post",
                    async () => {
                        const author = await seedUser("kc-pin-author",
                            "pin-author")
                        const founder = await seedUser("kc-pin-founder",
                            FOUNDER_USERNAME)
                        const post = await communityPostService.createPost({
                            user: author,
                            channel: CommunityChannel.General,
                            body: "pin me",
                        })

                        const pinned = await communityPostService.setPinned({
                            postId: post.id,
                            pinned: true,
                            user: founder,
                        })
                        expect(pinned.isPinned).toBe(true)

                        const row = await entityManager.findOneOrFail(CommunityPostEntity,
                            {
                                where: {
                                    id: post.id,
                                },
                            })
                        expect(row.isPinned).toBe(true)

                        // the founder can unpin too
                        const unpinned = await communityPostService.setPinned({
                            postId: post.id,
                            pinned: false,
                            user: founder,
                        })
                        expect(unpinned.isPinned).toBe(false)
                    })

                it("a NON-founder is rejected — CommunityPostForbiddenException, is_pinned stays false",
                    async () => {
                        const author = await seedUser("kc-pin-author-2",
                            "pin-author-2")
                        const notFounder = await seedUser("kc-pin-not-founder",
                            "definitely-not-the-founder")
                        const post = await communityPostService.createPost({
                            user: author,
                            channel: CommunityChannel.General,
                            body: "cannot pin me",
                        })

                        await expect(
                            communityPostService.setPinned({
                                postId: post.id,
                                pinned: true,
                                user: notFounder,
                            }),
                        ).rejects.toBeInstanceOf(CommunityPostForbiddenException)

                        const row = await entityManager.findOneOrFail(CommunityPostEntity,
                            {
                                where: {
                                    id: post.id,
                                },
                            })
                        expect(row.isPinned).toBe(false)
                    })

                it("even the post's OWN AUTHOR cannot pin their own post unless they are the founder",
                    async () => {
                        const author = await seedUser("kc-pin-self",
                            "pin-self-author")
                        const post = await communityPostService.createPost({
                            user: author,
                            channel: CommunityChannel.General,
                            body: "self-pin attempt",
                        })

                        await expect(
                            communityPostService.setPinned({
                                postId: post.id,
                                pinned: true,
                                user: author,
                            }),
                        ).rejects.toBeInstanceOf(CommunityPostForbiddenException)
                    })
            })

        describe("post-quota — non-members capped over a rolling window, members exempt",
            () => {
                it(`a non-member may create exactly ${NON_MEMBER_POST_LIMIT} posts; the next one throws CommunityPostQuotaExceededException and writes NOTHING`,
                    async () => {
                        const user = await seedUser("kc-quota-non-member",
                            "quota-non-member")

                        for (let i = 0; i < NON_MEMBER_POST_LIMIT; i += 1) {
                            await communityPostService.createPost({
                                user,
                                channel: CommunityChannel.General,
                                body: `post #${i}`,
                            })
                        }

                        await expect(
                            communityPostService.createPost({
                                user,
                                channel: CommunityChannel.General,
                                body: "over the cap",
                            }),
                        ).rejects.toBeInstanceOf(CommunityPostQuotaExceededException)

                        const count = await entityManager.count(CommunityPostEntity,
                            {
                                where: {
                                    author: {
                                        id: user.id,
                                    },
                                },
                            })
                        expect(count).toBe(NON_MEMBER_POST_LIMIT)
                    })

                it("soft-deleted posts still count toward the quota — deleting one does NOT free up a slot",
                    async () => {
                        const user = await seedUser("kc-quota-deleted-still-counts",
                            "quota-deleted-still-counts")

                        const posts = []
                        for (let i = 0; i < NON_MEMBER_POST_LIMIT; i += 1) {
                            posts.push(await communityPostService.createPost({
                                user,
                                channel: CommunityChannel.General,
                                body: `post #${i}`,
                            }))
                        }
                        // deleting one does NOT reset the rolling-window count
                        await communityPostService.softDeletePost({
                            postId: posts[0].id,
                            user,
                        })

                        await expect(
                            communityPostService.createPost({
                                user,
                                channel: CommunityChannel.General,
                                body: "still over the cap",
                            }),
                        ).rejects.toBeInstanceOf(CommunityPostQuotaExceededException)
                    })

                it("an ACTIVE MEMBER is never gated by the quota, even past the non-member cap",
                    async () => {
                        const member = await seedUser("kc-quota-member",
                            "quota-member")
                        await seedActiveMembership(member)

                        for (let i = 0; i < NON_MEMBER_POST_LIMIT + 2; i += 1) {
                            await communityPostService.createPost({
                                user: member,
                                channel: CommunityChannel.General,
                                body: `member post #${i}`,
                            })
                        }

                        const count = await entityManager.count(CommunityPostEntity,
                            {
                                where: {
                                    author: {
                                        id: member.id,
                                    },
                                },
                            })
                        expect(count).toBe(NON_MEMBER_POST_LIMIT + 2)
                    })
            })
    })
