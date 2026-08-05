import request from "supertest"
import {
    Test,
} from "@nestjs/testing"
import type {
    CanActivate,
    ExecutionContext,
    INestApplication,
} from "@nestjs/common"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    ApolloServerModule,
    ApolloServerType,
} from "@modules/api"
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
    KeycloakAuthGraphQLGuard,
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/keycloak"
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
import {
    CommunityFeedResolver,
    CommunityFeedService,
} from "@features/api/core/graphql/queries/community/community-feed"
import {
    CommunityPostResolver,
    CommunityPostQueryService,
} from "@features/api/core/graphql/queries/community/community-post"
import {
    CommunityPostCommentsResolver,
    CommunityPostCommentsService,
} from "@features/api/core/graphql/queries/community/community-post-comments"
import {
    CreateCommunityPostCommentResolver,
    CreateCommunityPostCommentService,
} from "@features/api/core/graphql/mutations/community/create-community-post-comment"
import {
    ReactToCommunityPostCommentResolver,
    ReactToCommunityPostCommentService,
} from "@features/api/core/graphql/mutations/community/react-to-community-post-comment"
import {
    TestHelpersModule,
} from "@tests/helpers"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Founder username the pin gate reads from `envConfig().community.founderUsername`
 *  (unmocked here -- its default, see `src/modules/platform/env/config.ts`). */
const FOUNDER_USERNAME = "starci183"

/** Default non-member post cap + rolling window, also read off the unmocked env default. */
const NON_MEMBER_POST_LIMIT = 3

/**
 * e2e for the community UGC write-flows -- `.claude/canon/be/enforce/authoring/testing.md`
 * §2 names "a community post or reaction" explicitly as a write flow that must carry
 * `*.e2e-spec.ts` coverage. Exercises {@link CommunityPostService},
 * {@link CommunityCommentService}, {@link CommunityReactionService}, and
 * {@link CommunityPostQuotaService} against REAL Postgres (Testcontainers) -- not the
 * mocked-`EntityManager` unit level already covered by each service's own `.spec.ts`.
 *
 * In focus: the OWNERSHIP guard on post/comment update+delete (the IDOR class -- a
 * non-author must never mutate someone else's row), the founder-only pin gate, the
 * non-member post quota (rolling window, deleted rows still count), and soft-delete
 * landing on the real `is_deleted` column rather than removing the row.
 *
 * MOCKED (no external infra available in this harness, genuinely external to the
 * community domain under test):
 *  - `EventEmitterService` -- real class fans out to EventEmitter2 + NATS; stubbed so
 *    a mutation's room-broadcast side effect never touches either.
 *  - `NotificationService` -- real class writes a notification row AND re-fans-out
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
                    TestHelpersModule,
                    // real Postgres against the Testcontainers DB -- no hydration/
                    // resolvers/seeders, this focused app doesn't need them
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                ],
                providers: [
                    // REAL -- the post/comment/reaction/quota logic under test
                    CommunityPostService,
                    CommunityCommentService,
                    CommunityReactionService,
                    CommunityPostQuotaService,
                    // REAL -- the quota's member/non-member branch + rolling-window math
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

                        // the row still exists -- soft delete, not a removal
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

                        // the reply row still exists -- thread shape survives
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

/**
 * e2e for the community READ resolvers (`communityFeed`, `communityPost`,
 * `communityPostComments`) plus the `createCommunityPostComment` /
 * `reactToCommunityPostComment` mutations -- driven over REAL HTTP through Apollo
 * (`ApolloServerModule` + guards), not the bare domain-service calls above. None of
 * these five GraphQL operations had coverage that exercised the resolver + guard +
 * response-wrapper layer: the block above proves the domain services are correct,
 * this block proves production's actual request path (auth guard -> resolver ->
 * query/mutation service -> `GraphQLTransformInterceptor`'s success/error envelope)
 * wires them together correctly.
 *
 * MOCKED (same externals as the block above, genuinely outside this domain):
 *  - `EventEmitterService`, `NotificationService`.
 *
 * REAL: Postgres (Testcontainers), the full Apollo/GraphQL stack, every resolver +
 * query/mutation service under test, and the community domain services they call.
 * `KeycloakOptionalAuthGraphQLGuard` / `KeycloakAuthGraphQLGuard` are overridden
 * with a fake `CanActivate` (mirrors `progress-query.e2e-spec.ts`) since there is no
 * live Keycloak server in this harness -- the override still exercises the REAL
 * per-resolver `@UseGuards` wiring (optional-auth passthrough vs. auth-required
 * rejection), only the token verification itself is stubbed.
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Community GraphQL — communityFeed/communityPost/communityPostComments queries + comment mutations (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager

        /** The "logged in" user the overridden guards stamp onto the request; null = anonymous/unauthenticated. */
        let currentUser: UserEntity | null = null

        // KeycloakOptionalAuthGraphQLGuard: never blocks -- stamps req.user when
        // a viewer is "logged in", leaves it unset (truly anonymous) otherwise.
        const fakeOptionalAuthGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                const gqlContext = GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>()
                if (currentUser) {
                    gqlContext.req.user = currentUser
                }
                return true
            },
        }
        // KeycloakAuthGraphQLGuard: mirrors progress-query.e2e-spec.ts's fakeAuthGuard --
        // rejects (-> Nest's default ForbiddenException) when nobody is "logged in".
        const fakeAuthGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                if (!currentUser) {
                    return false
                }
                const gqlContext = GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>()
                gqlContext.req.user = currentUser
                return true
            },
        }

        const eventEmitterServiceMock = {
            emit: jest.fn().mockResolvedValue(undefined),
        }
        const notificationServiceMock = {
            createNotification: jest.fn().mockResolvedValue(undefined),
        }

        const GRAPHQL_ENDPOINT = "/graphql"

        const COMMUNITY_FEED_QUERY = `
            query CommunityFeed($request: CommunityFeedRequest!) {
                communityFeed(request: $request) {
                    success
                    message
                    error
                    data {
                        items {
                            id
                            body
                            channel
                            commentCount
                            isMine
                            reactions {
                                total
                                myReaction
                            }
                        }
                        nextCursor
                    }
                }
            }
        `
        const COMMUNITY_POST_QUERY = `
            query CommunityPostRead($request: CommunityPostRequest!) {
                communityPost(request: $request) {
                    success
                    message
                    error
                    data {
                        id
                        body
                        channel
                        commentCount
                        reactions {
                            total
                            myReaction
                        }
                    }
                }
            }
        `
        const COMMUNITY_POST_COMMENTS_QUERY = `
            query CommunityPostCommentsRead($request: CommunityPostCommentsRequest!) {
                communityPostComments(request: $request) {
                    success
                    message
                    error
                    data {
                        comments {
                            id
                            body
                            parentCommentId
                            replyCount
                        }
                        total
                    }
                }
            }
        `
        const CREATE_COMMUNITY_POST_COMMENT_MUTATION = `
            mutation CreateCommunityPostCommentWrite($request: CreateCommunityPostCommentRequest!) {
                createCommunityPostComment(request: $request) {
                    success
                    message
                    error
                    data {
                        id
                        body
                        parentCommentId
                    }
                }
            }
        `
        const REACT_TO_COMMUNITY_POST_COMMENT_MUTATION = `
            mutation ReactToCommunityPostCommentWrite($request: ReactToCommunityPostCommentRequest!) {
                reactToCommunityPostComment(request: $request) {
                    success
                    message
                    error
                    data {
                        total
                        myReaction
                    }
                }
            }
        `

        const post = (query: string, variables: Record<string, unknown>) =>
            request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query,
                    variables,
                })

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic,
                        useServices: false,
                    }),
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                ],
                providers: [
                    // REAL -- resolvers + their query/mutation services under test
                    CommunityFeedResolver,
                    CommunityFeedService,
                    CommunityPostResolver,
                    CommunityPostQueryService,
                    CommunityPostCommentsResolver,
                    CommunityPostCommentsService,
                    CreateCommunityPostCommentResolver,
                    CreateCommunityPostCommentService,
                    ReactToCommunityPostCommentResolver,
                    ReactToCommunityPostCommentService,
                    // REAL -- the domain services the query/mutation services delegate to
                    CommunityPostService,
                    CommunityCommentService,
                    CommunityReactionService,
                    CommunityPostQuotaService,
                    MembershipService,
                    DayjsService,
                    {
                        provide: EventEmitterService,
                        useValue: eventEmitterServiceMock,
                    },
                    {
                        provide: NotificationService,
                        useValue: notificationServiceMock,
                    },
                ],
            })
                .overrideGuard(KeycloakOptionalAuthGraphQLGuard)
                .useValue(fakeOptionalAuthGuard)
                .overrideGuard(KeycloakAuthGraphQLGuard)
                .useValue(fakeAuthGuard)
                .compile()

            app = moduleRef.createNestApplication()
            await app.init()

            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE \"community_post_comment_reactions\", \"community_post_reactions\", \"community_post_comments\", \"community_posts\", \"memberships\", \"users\" RESTART IDENTITY CASCADE",
            )
            currentUser = null
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

        describe("communityFeed query",
            () => {
                it("lists posts (author + reaction summary) and reflects the AUTHENTICATED viewer's own reaction",
                    async () => {
                        const author = await seedUser("kc-gql-feed-author",
                            "gql-feed-author")
                        const viewer = await seedUser("kc-gql-feed-viewer",
                            "gql-feed-viewer")
                        const postA = await entityManager.save(
                            entityManager.create(CommunityPostEntity,
                                {
                                    author,
                                    channel: CommunityChannel.General,
                                    body: "first post",
                                }),
                        )
                        await entityManager.save(
                            entityManager.create(CommunityPostReactionEntity,
                                {
                                    post: postA,
                                    user: viewer,
                                    type: ReactionType.Love,
                                }),
                        )
                        await entityManager.save(
                            entityManager.create(CommunityPostEntity,
                                {
                                    author,
                                    channel: CommunityChannel.General,
                                    body: "second post",
                                }),
                        )

                        currentUser = viewer
                        const response = await post(COMMUNITY_FEED_QUERY,
                            {
                                request: {
                                    limit: 20,
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.communityFeed
                        expect(body.success).toBe(true)
                        expect(body.data.items).toHaveLength(2)
                        const first = body.data.items.find((item: { id: string }) => item.id === postA.id)
                        expect(first.body).toBe("first post")
                        expect(first.reactions.total).toBe(1)
                        expect(first.reactions.myReaction).toBe("love")
                        expect(first.isMine).toBe(false)
                    })

                it("validation: an oversized limit is clamped server-side, never handed straight to the DB query",
                    async () => {
                        const author = await seedUser("kc-gql-feed-clamp",
                            "gql-feed-clamp")
                        for (let i = 0; i < 3; i += 1) {
                            await entityManager.save(
                                entityManager.create(CommunityPostEntity,
                                    {
                                        author,
                                        channel: CommunityChannel.General,
                                        body: `post #${i}`,
                                    }),
                            )
                        }

                        // anonymous (currentUser stays null) -- communityFeed is optional-auth
                        const response = await post(COMMUNITY_FEED_QUERY,
                            {
                                request: {
                                    limit: 999,
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.communityFeed
                        expect(body.success).toBe(true)
                        // only 3 posts exist -- proves the clamp didn't error, it just bounded the query
                        expect(body.data.items).toHaveLength(3)
                        expect(body.data.items.every((item: { reactions: { myReaction: string | null } }) =>
                            item.reactions.myReaction === null)).toBe(true)
                    })
            })

        describe("communityPost query",
            () => {
                it("fetches a single post by id with its reaction summary",
                    async () => {
                        const author = await seedUser("kc-gql-post-author",
                            "gql-post-author")
                        const singlePost = await entityManager.save(
                            entityManager.create(CommunityPostEntity,
                                {
                                    author,
                                    channel: CommunityChannel.Problems,
                                    body: "need help with this",
                                }),
                        )

                        const response = await post(COMMUNITY_POST_QUERY,
                            {
                                request: {
                                    postId: singlePost.id,
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.communityPost
                        expect(body.success).toBe(true)
                        expect(body.data.id).toBe(singlePost.id)
                        expect(body.data.body).toBe("need help with this")
                        expect(body.data.channel).toBe("problems")
                        expect(body.data.reactions.total).toBe(0)
                    })

                it("not-found: a non-existent postId surfaces CommunityPostNotFoundException through the response envelope, not a crash",
                    async () => {
                        const response = await post(COMMUNITY_POST_QUERY,
                            {
                                request: {
                                    postId: "77777777-7777-4777-8777-777777777777",
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.communityPost
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("COMMUNITY_POST_NOT_FOUND_EXCEPTION")
                    })
            })

        describe("communityPostComments query",
            () => {
                it("lists top-level comments, then a parent's replies, each with its own total",
                    async () => {
                        const author = await seedUser("kc-gql-comments-author",
                            "gql-comments-author")
                        const parentPost = await entityManager.save(
                            entityManager.create(CommunityPostEntity,
                                {
                                    author,
                                    channel: CommunityChannel.General,
                                    body: "post with comments",
                                }),
                        )
                        const topLevel = await entityManager.save(
                            entityManager.create(CommunityPostCommentEntity,
                                {
                                    post: parentPost,
                                    user: author,
                                    body: "top-level comment",
                                }),
                        )
                        await entityManager.save(
                            entityManager.create(CommunityPostCommentEntity,
                                {
                                    post: parentPost,
                                    user: author,
                                    parentComment: topLevel,
                                    body: "a reply",
                                }),
                        )

                        const topLevelResponse = await post(COMMUNITY_POST_COMMENTS_QUERY,
                            {
                                request: {
                                    postId: parentPost.id,
                                },
                            })
                        const topLevelBody = topLevelResponse.body.data.communityPostComments
                        expect(topLevelBody.success).toBe(true)
                        expect(topLevelBody.data.total).toBe(1)
                        expect(topLevelBody.data.comments[0].id).toBe(topLevel.id)
                        expect(topLevelBody.data.comments[0].replyCount).toBe(1)

                        const repliesResponse = await post(COMMUNITY_POST_COMMENTS_QUERY,
                            {
                                request: {
                                    postId: parentPost.id,
                                    parentCommentId: topLevel.id,
                                },
                            })
                        const repliesBody = repliesResponse.body.data.communityPostComments
                        expect(repliesBody.data.total).toBe(1)
                        expect(repliesBody.data.comments[0].body).toBe("a reply")
                    })

                it("not-found: a non-existent postId returns an EMPTY page (never errors, never leaks another post's comments)",
                    async () => {
                        const response = await post(COMMUNITY_POST_COMMENTS_QUERY,
                            {
                                request: {
                                    postId: "88888888-8888-4888-8888-888888888888",
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.communityPostComments
                        expect(body.success).toBe(true)
                        expect(body.data.comments).toEqual([])
                        expect(body.data.total).toBe(0)
                    })
            })

        describe("createCommunityPostComment mutation",
            () => {
                it("an AUTHENTICATED user creates a top-level comment — persisted as a real row",
                    async () => {
                        const author = await seedUser("kc-gql-create-comment-author",
                            "gql-create-comment-author")
                        const commenter = await seedUser("kc-gql-create-comment-user",
                            "gql-create-comment-user")
                        const targetPost = await entityManager.save(
                            entityManager.create(CommunityPostEntity,
                                {
                                    author,
                                    channel: CommunityChannel.General,
                                    body: "comment on me",
                                }),
                        )

                        currentUser = commenter
                        const response = await post(CREATE_COMMUNITY_POST_COMMENT_MUTATION,
                            {
                                request: {
                                    postId: targetPost.id,
                                    body: "a fresh comment",
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.createCommunityPostComment
                        expect(body.success).toBe(true)
                        expect(body.data.body).toBe("a fresh comment")
                        expect(body.data.parentCommentId).toBeNull()

                        const row = await entityManager.findOneOrFail(CommunityPostCommentEntity,
                            {
                                where: {
                                    id: body.data.id,
                                },
                            })
                        expect(row.body).toBe("a fresh comment")
                        expect(row.userId).toBe(commenter.id)
                    })

                it("auth denied: an UNAUTHENTICATED request is rejected before the resolver runs, writes NO row",
                    async () => {
                        const author = await seedUser("kc-gql-create-comment-noauth",
                            "gql-create-comment-noauth")
                        const targetPost = await entityManager.save(
                            entityManager.create(CommunityPostEntity,
                                {
                                    author,
                                    channel: CommunityChannel.General,
                                    body: "comment target",
                                }),
                        )

                        // currentUser left null -- the auth guard must deny before the mutation runs
                        const response = await post(CREATE_COMMUNITY_POST_COMMENT_MUTATION,
                            {
                                request: {
                                    postId: targetPost.id,
                                    body: "should never land",
                                },
                            })

                        expect(response.body.errors).toBeDefined()
                        expect(response.body.errors.length).toBeGreaterThan(0)
                        const count = await entityManager.count(CommunityPostCommentEntity,
                            {
                                where: {
                                    post: {
                                        id: targetPost.id,
                                    },
                                },
                            })
                        expect(count).toBe(0)
                    })
            })

        describe("reactToCommunityPostComment mutation",
            () => {
                it("an AUTHENTICATED user reacts to a comment — real row + refreshed summary",
                    async () => {
                        const author = await seedUser("kc-gql-react-comment-author",
                            "gql-react-comment-author")
                        const reactor = await seedUser("kc-gql-react-comment-user",
                            "gql-react-comment-user")
                        const targetPost = await entityManager.save(
                            entityManager.create(CommunityPostEntity,
                                {
                                    author,
                                    channel: CommunityChannel.General,
                                    body: "post",
                                }),
                        )
                        const comment = await entityManager.save(
                            entityManager.create(CommunityPostCommentEntity,
                                {
                                    post: targetPost,
                                    user: author,
                                    body: "react to me",
                                }),
                        )

                        currentUser = reactor
                        const response = await post(REACT_TO_COMMUNITY_POST_COMMENT_MUTATION,
                            {
                                request: {
                                    commentId: comment.id,
                                    type: "haha",
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.reactToCommunityPostComment
                        expect(body.success).toBe(true)
                        expect(body.data.total).toBe(1)
                        expect(body.data.myReaction).toBe("haha")

                        const rowCount = await entityManager.count(CommunityPostCommentReactionEntity,
                            {
                                where: {
                                    comment: {
                                        id: comment.id,
                                    },
                                    user: {
                                        id: reactor.id,
                                    },
                                },
                            })
                        expect(rowCount).toBe(1)
                    })

                it("not-found: reacting to a non-existent commentId surfaces CommunityPostCommentNotFoundException",
                    async () => {
                        currentUser = await seedUser("kc-gql-react-comment-404",
                            "gql-react-comment-404")

                        const response = await post(REACT_TO_COMMUNITY_POST_COMMENT_MUTATION,
                            {
                                request: {
                                    commentId: "99999999-9999-4999-8999-999999999999",
                                    type: "like",
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.reactToCommunityPostComment
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("COMMUNITY_POST_COMMENT_NOT_FOUND_EXCEPTION")
                    })
            })
    })
