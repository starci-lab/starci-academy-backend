import type {
    INestApplication,
} from "@nestjs/common"
import {
    Test,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    io,
    type Socket,
} from "socket.io-client"
import type {
    EntityManager,
} from "typeorm"
import type {
    Namespace,
} from "socket.io"
import {
    CommunityChatGateway,
} from "@features/socketio/core/community-chat/community-chat.gateway"
import {
    CommunityChatRoomService,
} from "@features/socketio/core/community-chat/community-chat-room.service"
import {
    PublicationEvent,
} from "@features/socketio/core/enums/publication-event"
import {
    SubscriptionEvent,
} from "@features/socketio/core/enums/subscription-event"
import {
    ChatService,
} from "@modules/bussiness/chat/chat.service"
import {
    ChatConversationEntity,
} from "@modules/databases/postgresql/primary/entities/chat-conversation.entity"
import {
    MembershipEntity,
} from "@modules/databases/postgresql/primary/entities/membership.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    ChatConversationType,
} from "@modules/databases/postgresql/primary/enums/chat-conversation-type"
import {
    MembershipStatus,
} from "@modules/databases/postgresql/primary/enums/membership-status"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    KeycloakTokenService,
} from "@modules/integrations/keycloak/token.service"
import {
    SUPERJSON,
} from "@modules/lib/mixin/constants/superjson"
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
    WsResponseService,
} from "@modules/platform/socketio/response.service"
import {
    nextMessage,
    until,
} from "@tests/helpers/flow-wait"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

interface SubscriptionResult {
    success: boolean
    error?: string
    data?: {
        conversationId: string
    }
}

describe("community chat rooms admit only authenticated conversation participants",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let owner: UserEntity
        let otherMember: UserEntity
        let outsider: UserEntity
        let ownerDm: ChatConversationEntity
        let ownerSocket: Socket
        let otherMemberSocket: Socket
        let outsiderSocket: Socket

        const connect = async (token: string): Promise<Socket> => {
            const socket = io(`${await app.getUrl()}/community_chat`,
                {
                    transports: ["websocket"],
                    auth: {
                        token,
                    },
                    forceNew: true,
                })
            await new Promise<void>((resolve, reject) => {
                socket.once("connect",
                    resolve)
                socket.once("connect_error",
                    reject)
            })
            return socket
        }

        const subscribe = async (
            socket: Socket,
            conversationId: string,
        ): Promise<SubscriptionResult> => {
            const result = nextMessage<SubscriptionResult>(socket,
                SubscriptionEvent.CommunityChatSubscription)
            socket.emit(PublicationEvent.SubscribeCommunityChat,
                {
                    data: {
                        conversationId,
                    },
                })
            return result
        }

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                ],
                providers: [
                    DayjsService,
                    MembershipService,
                    ChatService,
                    CommunityChatRoomService,
                    WsResponseService,
                    CommunityChatGateway,
                    {
                        provide: KeycloakTokenService,
                        // Keycloak is the external auth boundary. Everything
                        // after token verification (user lookup, membership and
                        // DM ownership) remains production code against Postgres.
                        useValue: {
                            verifyAccessToken: jest.fn(async (token: string) => ({
                                active: true,
                                sub: token,
                            })),
                        },
                    },
                    {
                        provide: EventEmitterService,
                        useValue: {
                            on: jest.fn(),
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
            }).compile()
            app = moduleRef.createNestApplication()
            globalThis.__APP__ = app
            await app.listen(0)
            entityManager = app.get(getEntityManagerToken("primary"))
            await entityManager.query("TRUNCATE TABLE \"chat_messages\", \"chat_conversations\", \"memberships\", \"users\" RESTART IDENTITY CASCADE")

            const users = await entityManager.save([
                entityManager.create(UserEntity,
                    {
                        keycloakId: "kc-chat-owner",
                        username: "chat-owner",
                    }),
                entityManager.create(UserEntity,
                    {
                        keycloakId: "kc-chat-other-member",
                        username: "chat-other-member",
                    }),
                entityManager.create(UserEntity,
                    {
                        keycloakId: "kc-chat-outsider",
                        username: "chat-outsider",
                    }),
            ])
            owner = users[0]
            otherMember = users[1]
            outsider = users[2]
            await entityManager.save([
                entityManager.create(MembershipEntity,
                    {
                        user: owner,
                        status: MembershipStatus.Active,
                        currentPeriodEnd: new Date("2099-01-01T00:00:00.000Z"),
                        autoRenew: false,
                    }),
                entityManager.create(MembershipEntity,
                    {
                        user: otherMember,
                        status: MembershipStatus.Active,
                        currentPeriodEnd: new Date("2099-01-01T00:00:00.000Z"),
                        autoRenew: false,
                    }),
            ])
            ownerDm = await entityManager.save(entityManager.create(ChatConversationEntity,
                {
                    type: ChatConversationType.FounderDm,
                    member: owner,
                }))
        })

        afterAll(async () => {
            ownerSocket?.disconnect()
            otherMemberSocket?.disconnect()
            outsiderSocket?.disconnect()
            await app?.close().catch(() => undefined)
        })

        it("rejects an anonymous socket during the production handshake",
            async () => {
                const anonymous = io(`${await app.getUrl()}/community_chat`,
                    {
                        transports: ["websocket"],
                        forceNew: true,
                    })
                const error = await nextMessage<Error>(anonymous,
                    "connect_error")
                anonymous.disconnect()
                expect(error.message).toContain("access token")
            })

        it("connects authenticated actors without granting a room implicitly",
            async () => {
                const sockets = await Promise.all([
                    connect(owner.keycloakId),
                    connect(otherMember.keycloakId),
                    connect(outsider.keycloakId),
                ])
                ownerSocket = sockets[0]
                otherMemberSocket = sockets[1]
                outsiderSocket = sockets[2]
                const namespace = (app.get(CommunityChatGateway) as unknown as {
                    server: Namespace
                }).server
                const room = app.get(CommunityChatRoomService).name(ownerDm.id)
                expect(namespace.adapter.rooms.get(room)).toBeUndefined()
            })

        it("admits the active owner to their founder-DM room",
            async () => {
                const result = await subscribe(ownerSocket,
                    ownerDm.id)
                expect(result).toEqual(expect.objectContaining({
                    success: true,
                    data: {
                        conversationId: ownerDm.id,
                    },
                }))
                const namespace = (app.get(CommunityChatGateway) as unknown as {
                    server: Namespace
                }).server
                const room = app.get(CommunityChatRoomService).name(ownerDm.id)
                await until(() => Boolean(ownerSocket.id
                    && namespace.adapter.rooms.get(room)?.has(ownerSocket.id)),
                {
                    describe: "the authorized owner to join the founder-DM room",
                })
            })

        it("keeps another active member out of the owner's founder-DM room",
            async () => {
                const result = await subscribe(otherMemberSocket,
                    ownerDm.id)
                expect(result.success).toBe(false)
                expect(result.error).toBe("CHAT_FORBIDDEN_EXCEPTION")
                const namespace = (app.get(CommunityChatGateway) as unknown as {
                    server: Namespace
                }).server
                const room = app.get(CommunityChatRoomService).name(ownerDm.id)
                expect(namespace.adapter.rooms.get(room)?.has(otherMemberSocket.id!)).toBe(false)
            })

        it("keeps a non-member out of every community-chat room",
            async () => {
                const result = await subscribe(outsiderSocket,
                    ownerDm.id)
                expect(result.success).toBe(false)
                expect(result.error).toBe("CHAT_MEMBERSHIP_REQUIRED_EXCEPTION")
                const namespace = (app.get(CommunityChatGateway) as unknown as {
                    server: Namespace
                }).server
                const room = app.get(CommunityChatRoomService).name(ownerDm.id)
                expect(namespace.adapter.rooms.get(room)?.has(outsiderSocket.id!)).toBe(false)
            })
    })
