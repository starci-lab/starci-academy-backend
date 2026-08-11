import request from "supertest"
import type {
    Namespace,
} from "socket.io"
import {
    io,
    type Socket,
} from "socket.io-client"
import type {
    CanActivate,
    ExecutionContext,
    INestApplication,
} from "@nestjs/common"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    Test,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    ApolloServerModule,
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType,
} from "@modules/api/apollo/server/enums/server"
import {
    CreateCommunityPostResolver,
} from "@features/api/core/graphql/mutations/community/create-community-post/create-community-post.resolver"
import {
    CreateCommunityPostService,
} from "@features/api/core/graphql/mutations/community/create-community-post/create-community-post.service"
import {
    CreateCommunityPostCommentResolver,
} from "@features/api/core/graphql/mutations/community/create-community-post-comment/create-community-post-comment.resolver"
import {
    CreateCommunityPostCommentService,
} from "@features/api/core/graphql/mutations/community/create-community-post-comment/create-community-post-comment.service"
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
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
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
    nextMessage,
    until,
} from "@tests/helpers/flow-wait"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

interface FeedMessage {
    success: boolean
    data: { postId: string; commentId?: string }
}

interface FlowEventListenerParams {
    event: EventName
    listener: (payload: unknown) => void
}

interface FlowEventEmitParams {
    event: EventName
    payload: unknown
}

describe("a learner posts a community thread and receives a reply",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let actor: UserEntity | null = null
        let author: UserEntity
        let replier: UserEntity
        let socket: Socket
        let namespace: Namespace
        let roomService: CommunityFeedRoomService
        const listeners = new Map<EventName, Array<(payload: unknown) => void>>()
        const events = {
            on: jest.fn(({ event, listener }: FlowEventListenerParams) => {
                listeners.set(event,
                    [...(listeners.get(event) ?? []),
                        listener])
            }),
            emit: jest.fn(async ({ event, payload }: FlowEventEmitParams) => {
                for (const listener of listeners.get(event) ?? []) listener(payload)
            }),
            off: jest.fn(),
        }
        const guard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                if (!actor) return false
                GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>().req.user = actor
                return true
            },
        }

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic, useServices: false
                    }),
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true, withHydration: false, withResolvers: false
                    }),
                ],
                providers: [
                    CommunityPostService,
                    CommunityCommentService,
                    CreateCommunityPostService,
                    CreateCommunityPostResolver,
                    CreateCommunityPostCommentService,
                    CreateCommunityPostCommentResolver,
                    NotificationService,
                    UserStatsProjectionService,
                    CommunityFeedRoomService,
                    WsResponseService,
                    CommunityFeedGateway,
                    {
                        provide: CommunityPostQuotaService, useValue: {
                            assertCanCreatePost: jest.fn().mockResolvedValue(undefined)
                        }
                    },
                    {
                        provide: EventEmitterService, useValue: events
                    },
                    {
                        provide: SUPERJSON, useValue: {
                            stringify: JSON.stringify, parse: JSON.parse
                        }
                    },
                ],
            }).overrideGuard(KeycloakAuthGraphQLGuard).useValue(guard).compile()
            app = moduleRef.createNestApplication()
            await app.listen(0)
            entityManager = app.get(getEntityManagerToken("primary"))
            await entityManager.query("TRUNCATE TABLE \"notifications\", \"user_stats_projections\", \"community_post_comments\", \"community_posts\", \"users\" RESTART IDENTITY CASCADE")
            author = await entityManager.save(entityManager.create(UserEntity,
                {
                    keycloakId: "community-author", username: "author"
                }))
            replier = await entityManager.save(entityManager.create(UserEntity,
                {
                    keycloakId: "community-replier", username: "replier"
                }))
            socket = io(`${await app.getUrl()}/community_feed`,
                {
                    transports: ["websocket"], forceNew: true
                })
            await new Promise<void>((resolve, reject) => {
                socket.once("connect",
                    resolve)
                socket.once("connect_error",
                    reject)
            })
            socket.emit(PublicationEvent.SubscribeCommunityFeed,
                {
                    data: {
                        channel: CommunityChannel.Problems
                    }, locale: Locale.En
                })
            namespace = (app.get(CommunityFeedGateway) as unknown as { server: Namespace }).server
            roomService = app.get(CommunityFeedRoomService)
            const room = roomService.channelRoom(CommunityChannel.Problems)
            await until(() => Boolean(socket.id && namespace.adapter.rooms.get(room)?.has(socket.id)),
                {
                    describe: "the viewer to join the community channel"
                })
        })

        afterAll(async () => {
            socket?.disconnect()
            await app?.close().catch(() => undefined)
        })

        it("creates the post and reply through GraphQL and pushes both changes",
            async () => {
                actor = author
                const postEvent = nextMessage<FeedMessage>(socket,
                    SubscriptionEvent.CommunityPostCreated)
                const postResponse = await request(app.getHttpServer()).post("/graphql").send({
                    query: "mutation { createCommunityPost(request: { channel: problems, body: \"How should this be solved?\" }) { success error data { id } } }",
                })
                const postId = postResponse.body.data.createCommunityPost.data.id as string
                expect((await postEvent).data.postId).toBe(postId)
                expect(await entityManager.count(CommunityPostEntity)).toBe(1)

                socket.emit(PublicationEvent.SubscribeCommunityFeed,
                    {
                        data: {
                            postId,
                        },
                        locale: Locale.En,
                    })
                await until(() => Boolean(socket.id && namespace.adapter.rooms.get(
                    roomService.postRoom(postId),
                )?.has(socket.id)),
                {
                    describe: "the viewer to join the community post room",
                })

                actor = replier
                const replyEvent = nextMessage<FeedMessage>(socket,
                    SubscriptionEvent.CommunityCommentCreated)
                const replyResponse = await request(app.getHttpServer()).post("/graphql").send({
                    query: `mutation { createCommunityPostComment(request: { postId: "${postId}", body: "Try a transaction." }) { success error data { id } } }`,
                })
                expect(replyResponse.body).toHaveProperty("data.createCommunityPostComment.success",
                    true)
                expect((await replyEvent).data.postId).toBe(postId)
                expect(await entityManager.count(CommunityPostCommentEntity)).toBe(1)
                expect(await entityManager.count(NotificationEntity,
                    {
                        where: {
                            user: {
                                id: author.id
                            }
                        }
                    })).toBe(1)
            })
    })
