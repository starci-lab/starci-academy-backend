import type {
    Namespace,
} from "socket.io"
import {
    io,
    type Socket,
} from "socket.io-client"
import {
    CommunityCommentService,
} from "@modules/bussiness/community/community-comment.service"
import {
    CommunityPostQuotaService,
} from "@modules/bussiness/community/community-post-quota.service"
import {
    CommunityPostService,
} from "@modules/bussiness/community/community-post.service"
import {
    NotificationService,
} from "@modules/bussiness/notification/notification.service"
import {
    UserStatsProjectionService,
} from "@modules/bussiness/projections/user-stats/user-stats-projection.service"
import {
    CommunityPostCommentEntity,
} from "@modules/databases/postgresql/primary/entities/community-post-comment.entity"
import {
    CommunityPostEntity,
} from "@modules/databases/postgresql/primary/entities/community-post.entity"
import {
    NotificationEntity,
} from "@modules/databases/postgresql/primary/entities/notification.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    CommunityChannel,
} from "@modules/databases/postgresql/primary/enums/community-channel"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    NotificationType,
} from "@modules/databases/postgresql/primary/enums/notification-type"
import {
    SUPERJSON,
} from "@modules/lib/mixin/constants/superjson"
import {
    EventName,
} from "@modules/platform/event/enums/event-name"
import {
    EventEmitterService,
} from "@modules/platform/event/event-emitter.service"
import {
    WsResponseService,
} from "@modules/platform/socketio/response.service"
import {
    CommunityFeedGateway,
} from "@features/socketio/core/community-feed/community-feed.gateway"
import {
    CommunityFeedRoomService,
} from "@features/socketio/core/community-feed/community-feed-room.service"
import {
    PublicationEvent,
} from "@features/socketio/core/enums/publication-event"
import {
    SubscriptionEvent,
} from "@features/socketio/core/enums/subscription-event"
import {
    bootFlowWorld,
} from "@tests/helpers/flow-world"
import type {
    FlowWorld,
} from "@tests/helpers/flow-world"
import {
    nextMessage,
    until,
} from "@tests/helpers/flow-wait"

interface CommunityPostSocketMessage {
    success: boolean
    data: {
        postId: string
        channel: CommunityChannel
    }
}

interface CommunityCommentSocketMessage {
    success: boolean
    data: {
        postId: string
        commentId: string
        parentCommentId: string | null
    }
}

/** A learner posts, another replies, and subscribed clients see both changes live. */
describe("a learner posts a community thread, receives a reply, and is notified",
    () => {
        let world: FlowWorld
        let postService: CommunityPostService
        let commentService: CommunityCommentService
        let roomService: CommunityFeedRoomService
        let namespace: Namespace
        let author: UserEntity
        let replier: UserEntity
        let viewer: Socket
        let viewerId: string
        let post: CommunityPostEntity

        const listeners = new Map<EventName, Array<(payload: unknown) => void>>()
        const eventEmitterService = {
            on: jest.fn((params: {
                event: EventName
                listener: (payload: unknown) => void
            }) => {
                const current = listeners.get(params.event) ?? []
                current.push(params.listener)
                listeners.set(params.event,
                    current)
            }),
            emit: jest.fn(async (params: {
                event: EventName
                payload: unknown
            }) => {
                for (const listener of listeners.get(params.event) ?? []) {
                    listener(params.payload)
                }
            }),
            off: jest.fn(),
        }

        beforeAll(async () => {
            world = await bootFlowWorld({
                providers: [
                    CommunityPostService,
                    CommunityCommentService,
                    NotificationService,
                    UserStatsProjectionService,
                    CommunityFeedRoomService,
                    WsResponseService,
                    CommunityFeedGateway,
                    {
                        provide: CommunityPostQuotaService,
                        useValue: {
                            assertCanCreatePost: jest.fn().mockResolvedValue(undefined),
                        },
                    },
                    {
                        provide: SUPERJSON,
                        useValue: {
                            stringify: JSON.stringify,
                            parse: JSON.parse,
                        },
                    },
                    {
                        provide: EventEmitterService,
                        useValue: eventEmitterService,
                    },
                ],
            })
            await world.app.listen(0)
            postService = world.app.get(CommunityPostService)
            commentService = world.app.get(CommunityCommentService)
            roomService = world.app.get(CommunityFeedRoomService)
            namespace = (world.app.get(CommunityFeedGateway) as unknown as {
                server: Namespace
            }).server

            await world.truncate(
                "notifications",
                "user_stats_projections",
                "community_post_comments",
                "community_posts",
                "users",
            )
            author = await world.entityManager.save(
                world.entityManager.create(UserEntity,
                    {
                        keycloakId: "kc-community-author",
                        username: "community-author",
                    }),
            )
            replier = await world.entityManager.save(
                world.entityManager.create(UserEntity,
                    {
                        keycloakId: "kc-community-replier",
                        username: "community-replier",
                    }),
            )

            viewer = io(`${await world.app.getUrl()}/community_feed`,
                {
                    transports: [
                        "websocket",
                    ],
                    forceNew: true,
                })
            await new Promise<void>((resolve, reject) => {
                viewer.once("connect",
                    resolve)
                viewer.once("connect_error",
                    reject)
            })
            if (!viewer.id) {
                throw new Error("Connected community socket must have an id")
            }
            viewerId = viewer.id
            viewer.emit(PublicationEvent.SubscribeCommunityFeed,
                {
                    data: {
                        channel: CommunityChannel.Problems,
                    },
                    locale: Locale.En,
                })
            await until(
                () => Boolean(namespace.adapter.rooms.get(
                    roomService.channelRoom(CommunityChannel.Problems),
                )?.has(viewerId)),
                {
                    describe: "the viewer to join the problems feed room",
                },
            )
        })

        afterAll(async () => {
            viewer?.disconnect()
            await world?.close()
        })

        it("persists a post and pushes it to the subscribed channel",
            async () => {
                const delivered = nextMessage<CommunityPostSocketMessage>(
                    viewer,
                    SubscriptionEvent.CommunityPostCreated,
                )
                post = await postService.createPost({
                    user: author,
                    channel: CommunityChannel.Problems,
                    body: "How should an idempotent webhook consumer handle retries?",
                })

                const message = await delivered
                expect(message.success).toBe(true)
                expect(message.data).toEqual({
                    postId: post.id,
                    channel: CommunityChannel.Problems,
                })
                expect(await world.entityManager.findOneByOrFail(
                    CommunityPostEntity,
                    {
                        id: post.id,
                    },
                )).toBeDefined()
            })

        it("persists a reply, pushes it to the post room, and notifies the author",
            async () => {
                viewer.emit(PublicationEvent.SubscribeCommunityFeed,
                    {
                        data: {
                            postId: post.id,
                        },
                        locale: Locale.En,
                    })
                await until(
                    () => Boolean(namespace.adapter.rooms.get(
                        roomService.postRoom(post.id),
                    )?.has(viewerId)),
                    {
                        describe: "the viewer to join the community post room",
                    },
                )

                const delivered = nextMessage<CommunityCommentSocketMessage>(
                    viewer,
                    SubscriptionEvent.CommunityCommentCreated,
                )
                const comment = await commentService.createComment({
                    postId: post.id,
                    parentCommentId: null,
                    body: "Store the provider event id under a unique constraint and acknowledge replays.",
                    user: replier,
                })

                const message = await delivered
                expect(message.data).toEqual({
                    postId: post.id,
                    commentId: comment.id,
                    parentCommentId: null,
                })
                expect(await world.entityManager.findOneByOrFail(
                    CommunityPostCommentEntity,
                    {
                        id: comment.id,
                    },
                )).toBeDefined()

                const notification = await world.entityManager.findOneByOrFail(
                    NotificationEntity,
                    {
                        user: {
                            id: author.id,
                        },
                        type: NotificationType.CommunityReply,
                    },
                )
                expect(notification.payload?.target?.id).toBe(post.id)
            })
    })
