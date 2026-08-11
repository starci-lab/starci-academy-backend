import request from "supertest"
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
    SendChatMessageResolver,
} from "@features/api/core/graphql/mutations/chat/send-chat-message/send-chat-message.resolver"
import {
    SendChatMessageService,
} from "@features/api/core/graphql/mutations/chat/send-chat-message/send-chat-message.service"
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
    ChatMessageEntity,
} from "@modules/databases/postgresql/primary/entities/chat-message.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    ChatConversationType,
} from "@modules/databases/postgresql/primary/enums/chat-conversation-type"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    SUPERJSON,
} from "@modules/lib/mixin/constants/superjson"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakTokenService,
} from "@modules/integrations/keycloak/token.service"
import {
    MembershipService,
} from "@modules/membership/membership.service"
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

interface ChatSocketMessage {
    success: boolean
    data: {
        conversationId: string
        messageId: string
        authorId: string
    }
}

interface FlowEventListenerParams {
    event: EventName
    listener: (payload: unknown) => void
}

interface FlowEventEmitParams {
    event: EventName
    payload: unknown
}

describe("a community member sends a message and the room receives it",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let member: UserEntity | null = null
        let conversation: ChatConversationEntity
        let socket: Socket
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
                if (!member) return false
                GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>().req.user = member
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
                    ChatService,
                    SendChatMessageService,
                    SendChatMessageResolver,
                    CommunityChatRoomService,
                    WsResponseService,
                    CommunityChatGateway,
                    {
                        provide: MembershipService, useValue: {
                            isActive: jest.fn().mockResolvedValue(true)
                        }
                    },
                    {
                        provide: EventEmitterService, useValue: events
                    },
                    {
                        provide: KeycloakTokenService, useValue: {
                            verifyAccessToken: jest.fn(async (token: string) => ({
                                active: true, sub: token
                            }))
                        }
                    },
                    {
                        provide: SUPERJSON, useValue: {
                            stringify: JSON.stringify, parse: JSON.parse
                        }
                    },
                ],
            }).overrideGuard(KeycloakAuthGraphQLGuard).useValue(guard).compile()
            app = moduleRef.createNestApplication()
            globalThis.__APP__ = app
            await app.listen(0)
            entityManager = app.get(getEntityManagerToken("primary"))

            await entityManager.query("TRUNCATE TABLE \"chat_messages\", \"chat_conversations\", \"users\" RESTART IDENTITY CASCADE")
            member = await entityManager.save(entityManager.create(UserEntity,
                {
                    keycloakId: `chat-member-${Date.now()}`, username: "chat-member"
                }))
            conversation = await entityManager.save(entityManager.create(ChatConversationEntity,
                {
                    type: ChatConversationType.Community, member: null
                }))
            socket = io(`${await app.getUrl()}/community_chat`,
                {
                    transports: ["websocket"], auth: {
                        token: member.keycloakId
                    }, forceNew: true
                })
            await new Promise<void>((resolve, reject) => {
                socket.once("connect",
                    resolve)
                socket.once("connect_error",
                    reject)
            })
            socket.emit(PublicationEvent.SubscribeCommunityChat,
                {
                    data: {
                        conversationId: conversation.id
                    }
                })
            const namespace = (app.get(CommunityChatGateway) as unknown as { server: { adapter: { rooms: Map<string, Set<string>> } } }).server
            const room = app.get(CommunityChatRoomService).name(conversation.id)
            await until(() => Boolean(socket.id && namespace.adapter.rooms.get(room)?.has(socket.id)),
                {
                    describe: "the client to join its community chat room"
                })
        })

        afterAll(async () => {
            socket?.disconnect()
            await app?.close().catch(() => undefined)
        })

        it("persists the message through GraphQL and delivers the matching socket event",
            async () => {
                const delivered = nextMessage<ChatSocketMessage>(socket,
                    SubscriptionEvent.ChatMessageCreated)
                const response = await request(app.getHttpServer()).post("/graphql").send({
                    query: `mutation { sendChatMessage(request: { conversationId: "${conversation.id}", body: "Hello room" }) { success error data { id body } } }`,
                })
                expect(response.body).toHaveProperty("data.sendChatMessage.success",
                    true)
                const message = await delivered
                expect(message.data.conversationId).toBe(conversation.id)
                expect(message.data.authorId).toBe(member?.id)
                expect(await entityManager.count(ChatMessageEntity)).toBe(1)
            })
    })
