import request from "supertest"
import {
    EventEmitterModule,
} from "@nestjs/event-emitter"
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
    Namespace,
} from "socket.io"
import {
    io,
    type Socket,
} from "socket.io-client"
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
    ReactToCommunityPostResolver,
} from "@features/api/core/graphql/mutations/community/react-to-community-post/react-to-community-post.resolver"
import {
    ReactToCommunityPostService,
} from "@features/api/core/graphql/mutations/community/react-to-community-post/react-to-community-post.service"
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
    CommunityPostQuotaService,
} from "@modules/bussiness/community/community-post-quota.service"
import {
    CommunityReactionService,
} from "@modules/bussiness/community/community-reaction.service"
import {
    CommunityPostService,
} from "@modules/bussiness/community/community-post.service"
import {
    CommunityPostEntity,
} from "@modules/databases/postgresql/primary/entities/community-post.entity"
import {
    CommunityPostReactionEntity,
} from "@modules/databases/postgresql/primary/entities/community-post-reaction.entity"
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
    ReactionType,
} from "@modules/databases/postgresql/primary/enums/reaction-type"
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
    createRedisKey,
} from "@modules/lib/native/redis/constants"
import {
    RedisInstanceKey,
} from "@modules/lib/native/redis/enums/instance-key"
import {
    RedisModule,
} from "@modules/lib/native/redis/redis.module"
import type {
    RedisClient,
} from "@modules/lib/native/redis/types/client"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    MembershipService,
} from "@modules/membership/membership.service"
import {
    EventEmitterService,
} from "@modules/platform/event/event-emitter.service"
import {
    NatsMessageFactoryService,
} from "@modules/platform/event/nats/nats-message-factory.service"
import {
    NatsProducerService,
} from "@modules/platform/event/nats/producer.service"
import {
    WsResponseService,
} from "@modules/platform/socketio/response.service"
import {
    RedisIoAdapter,
} from "@modules/platform/socketio/adapters/redis-io-adapter"
import {
    nextMessage,
    until,
} from "@tests/helpers/flow-wait"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

interface FeedMessage {
    success: boolean
    data: {
        postId: string
        channel: CommunityChannel
    }
}

describe("simultaneous community reactions converge on one durable reaction",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let author: UserEntity
        let postId: string
        let socket: Socket
        let namespace: Namespace
        let roomService: CommunityFeedRoomService
        const previousLimit = process.env.COMMUNITY_NON_MEMBER_POST_LIMIT

        const guard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>().req.user = author
                return true
            },
        }

        beforeAll(async () => {
            process.env.COMMUNITY_NON_MEMBER_POST_LIMIT = "1"
            process.env.REDIS_ADAPTER_HOST = process.env.REDIS_CACHE_HOST
            process.env.REDIS_ADAPTER_PORT = process.env.REDIS_CACHE_PORT
            process.env.REDIS_ADAPTER_PASSWORD = process.env.REDIS_CACHE_PASSWORD
            process.env.REDIS_ADAPTER_USE_CLUSTER = "false"
            delete process.env.REDIS_ADAPTER_PASSWORD_FILE
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    EventEmitterModule.forRoot(),
                    RedisModule.register({
                        isGlobal: false,
                        instanceKeys: [
                            RedisInstanceKey.Adapter,
                        ],
                    }),
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
                    DayjsService,
                    MembershipService,
                    CommunityPostQuotaService,
                    CommunityPostService,
                    CommunityReactionService,
                    CreateCommunityPostService,
                    CreateCommunityPostResolver,
                    ReactToCommunityPostService,
                    ReactToCommunityPostResolver,
                    EventEmitterService,
                    CommunityFeedRoomService,
                    WsResponseService,
                    CommunityFeedGateway,
                    {
                        provide: NatsProducerService,
                        // Community feed events are local-only. Keep the production
                        // event router real while closing the unused external NATS edge.
                        useValue: {
                            publish: jest.fn(),
                        },
                    },
                    {
                        provide: NatsMessageFactoryService,
                        useValue: {
                            create: jest.fn(),
                        },
                    },
                    {
                        provide: SUPERJSON,
                        useValue: {
                            stringify: JSON.stringify,
                            parse: JSON.parse,
                        },
                    },
                ],
            })
                .overrideGuard(KeycloakAuthGraphQLGuard)
                .useValue(guard)
                .compile()

            app = moduleRef.createNestApplication()
            const redisIoAdapter = new RedisIoAdapter(app)
            redisIoAdapter.setClient(app.get<RedisClient>(
                createRedisKey(RedisInstanceKey.Adapter),
            ))
            await redisIoAdapter.connect()
            app.useWebSocketAdapter(redisIoAdapter)
            await app.listen(0)
            entityManager = app.get(getEntityManagerToken("primary"))
            await entityManager.query(
                "TRUNCATE TABLE \"community_post_reactions\", \"community_posts\", \"memberships\", \"users\" RESTART IDENTITY CASCADE",
            )
            author = await entityManager.save(entityManager.create(UserEntity,
                {
                    keycloakId: "community-quota-racer",
                    username: "quota-racer",
                }))

            socket = io(`${await app.getUrl()}/community_feed`,
                {
                    transports: ["websocket"],
                    forceNew: true,
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
                        channel: CommunityChannel.Problems,
                    },
                    locale: Locale.En,
                })
            namespace = (app.get(CommunityFeedGateway) as unknown as { server: Namespace }).server
            roomService = app.get(CommunityFeedRoomService)
            await until(() => Boolean(socket.id && namespace.adapter.rooms.get(
                roomService.channelRoom(CommunityChannel.Problems),
            )?.has(socket.id)),
            {
                describe: "the observer to join the community channel",
            })
        })

        afterAll(async () => {
            socket?.disconnect()
            await app?.close().catch(() => undefined)
            if (previousLimit === undefined) {
                delete process.env.COMMUNITY_NON_MEMBER_POST_LIMIT
            } else {
                process.env.COMMUNITY_NON_MEMBER_POST_LIMIT = previousLimit
            }
        })

        it("creates the target post through HTTP and publishes the committed row through Socket.IO",
            async () => {
                const delivered = nextMessage<FeedMessage>(socket,
                    SubscriptionEvent.CommunityPostCreated)
                await request(app.getHttpServer())
                    .post("/graphql")
                    .send({
                        query: "mutation { createCommunityPost(request: { channel: problems, body: \"Reaction target\" }) { success error data { id } } }",
                    })

                const posts = await entityManager.find(CommunityPostEntity,
                    {
                        where: {
                            author: {
                                id: author.id,
                            },
                        },
                    })
                expect(posts).toHaveLength(1)
                postId = posts[0].id
                expect((await delivered).data).toEqual({
                    postId,
                    channel: CommunityChannel.Problems,
                })
            })

        it("keeps simultaneous first reactions idempotent instead of leaking a unique-key failure",
            async () => {
                const responses = await Promise.all(Array.from({
                    length: 16,
                },
                () => request(app.getHttpServer())
                    .post("/graphql")
                    .send({
                        query: `mutation { reactToCommunityPost(request: { postId: "${postId}", type: like }) { success error data { total myReaction } } }`,
                    })))

                expect(responses.every((response) => response.body.data
                    ?.reactToCommunityPost?.success === true)).toBe(true)
                const reactions = await entityManager.find(CommunityPostReactionEntity,
                    {
                        where: {
                            post: {
                                id: postId,
                            },
                            user: {
                                id: author.id,
                            },
                        },
                    })
                expect(reactions).toHaveLength(1)
                expect(reactions[0].type).toBe(ReactionType.Like)
            })
    })
