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
    ChatConversationEntity,
    ChatConversationType,
    ChatMessageEntity,
    MembershipEntity,
    MembershipStatus,
    PrimaryPostgreSQLModule,
    UserEntity,
} from "@modules/databases"
import {
    ChatConversationNotFoundException,
    ChatForbiddenException,
    ChatMembershipRequiredException,
} from "@modules/exceptions"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    ChatService,
} from "@modules/bussiness"
import {
    EventEmitterService,
} from "@modules/event"
import {
    MembershipService,
} from "@modules/membership"
import {
    DayjsService,
} from "@modules/mixin"
import {
    ChatMessagesResolver,
    ChatMessagesService,
} from "@features/api/core/graphql/queries/chat/chat-messages"
import {
    CommunityChatConversationResolver,
    CommunityChatConversationService,
} from "@features/api/core/graphql/queries/chat/community-chat-conversation"
import {
    MyFounderConversationResolver,
    MyFounderConversationService,
} from "@features/api/core/graphql/queries/chat/my-founder-conversation"
import {
    TestHelpersModule,
} from "@tests/helpers"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

// the founder DM gate reads envConfig().community.founderUsername, whose
// default (unset here) is "starci183" -- see src/modules/platform/env/config.ts
// (mirrors the same constant already asserted in chat.service.spec.ts)
const FOUNDER_USERNAME = "starci183"

/**
 * e2e for community chat's write flow -- `sendMessage` -- `.claude/canon/be/
 * enforce/authoring/testing.md` §2 names every write flow that commits state
 * as required e2e coverage; {@link ChatService.sendMessage} had zero coverage
 * above the mocked-`EntityManager` unit level. Runs the real member-only gate
 * ({@link MembershipService.isActive} against a real `memberships` row) and
 * the real founder-DM ownership check against REAL Postgres (Testcontainers).
 *
 * MOCKED (genuinely external to the process, matches the pattern
 * `createE2eApp` uses for the same class):
 *  - `EventEmitterService` -- real class fans out through a NATS producer that
 *    needs a live broker connection; stubbed to a no-op so `sendMessage`'s
 *    room-broadcast side effect doesn't need NATS.
 *
 * REAL: Postgres (Testcontainers), `ChatService` (the send + access-check
 * logic under test), `MembershipService` (the member-only gate -- real SQL
 * against real `memberships` rows), and `DayjsService` (membership period
 * comparison, no external deps) -- so the private-DM access check runs
 * exactly as production wires it.
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Community chat — sendMessage + private-DM access (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let chatService: ChatService

        const eventEmitterServiceMock = {
            emit: jest.fn().mockResolvedValue(undefined),
            on: jest.fn(),
            off: jest.fn(),
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
                    // REAL -- the send + access-check logic under test
                    ChatService,
                    // REAL -- the member-only gate; only needs Postgres + DayjsService
                    MembershipService,
                    DayjsService,
                    {
                        provide: EventEmitterService,
                        useValue: eventEmitterServiceMock,
                    },
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            await app.init()

            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            chatService = app.get(ChatService)
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE \"users\", \"memberships\", \"chat_conversations\", \"chat_messages\" RESTART IDENTITY CASCADE",
            )
            jest.clearAllMocks()
        })

        /** Seed a bare user, optionally with a username (unset when omitted). */
        const seedUser = async (
            keycloakId: string,
            username?: string,
        ): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId,
                        ...(username
                            ? {
                                username,
                            }
                            : {
                            }),
                    }),
            )

        /** Grant the user a REAL active membership (period ends 30 days out). */
        const seedActiveMembership = async (userId: string): Promise<void> => {
            const periodEnd = new Date()
            periodEnd.setDate(periodEnd.getDate() + 30)
            await entityManager.save(
                entityManager.create(MembershipEntity,
                    {
                        user: {
                            id: userId,
                        },
                        status: MembershipStatus.Active,
                        currentPeriodEnd: periodEnd,
                        autoRenew: false,
                    }),
            )
        }

        describe("community room",
            () => {
                it("an active member sends a message → a REAL chat_messages row is committed, lazily creating the singleton community conversation",
                    async () => {
                        const member = await seedUser("kc-chat-member")
                        await seedActiveMembership(member.id)
                        const conversation = await chatService.getOrCreateCommunityConversation()

                        const message = await chatService.sendMessage({
                            conversationId: conversation.id,
                            body: "hello community",
                            user: member,
                        })

                        expect(message.body).toBe("hello community")
                        expect(message.authorId).toBe(member.id)
                        expect(message.conversationId).toBe(conversation.id)

                        const reloaded = await entityManager.findOneOrFail(ChatMessageEntity,
                            {
                                where: {
                                    id: message.id,
                                },
                            })
                        expect(reloaded.body).toBe("hello community")

                        // exactly one community room ever exists, even across calls
                        const secondLookup = await chatService.getOrCreateCommunityConversation()
                        expect(secondLookup.id).toBe(conversation.id)
                        const roomCount = await entityManager.count(ChatConversationEntity,
                            {
                                where: {
                                    type: ChatConversationType.Community,
                                },
                            })
                        expect(roomCount).toBe(1)
                    })

                it("a user with NO active membership is rejected with ChatMembershipRequiredException and writes NO message row",
                    async () => {
                        const nonMember = await seedUser("kc-chat-non-member")
                        // no membership row seeded at all -- never a member
                        const conversation = await chatService.getOrCreateCommunityConversation()

                        await expect(
                            chatService.sendMessage({
                                conversationId: conversation.id,
                                body: "let me in",
                                user: nonMember,
                            }),
                        ).rejects.toBeInstanceOf(ChatMembershipRequiredException)

                        const count = await entityManager.count(ChatMessageEntity)
                        expect(count).toBe(0)
                    })

                it("an EXPIRED membership does not satisfy the gate — treated the same as never-a-member",
                    async () => {
                        const lapsedMember = await seedUser("kc-chat-lapsed")
                        await entityManager.save(
                            entityManager.create(MembershipEntity,
                                {
                                    user: {
                                        id: lapsedMember.id,
                                    },
                                    status: MembershipStatus.Expired,
                                    // period end still in the future, but the explicit
                                    // Expired status must win over the date check
                                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                                    autoRenew: false,
                                }),
                        )
                        const conversation = await chatService.getOrCreateCommunityConversation()

                        await expect(
                            chatService.sendMessage({
                                conversationId: conversation.id,
                                body: "still here?",
                                user: lapsedMember,
                            }),
                        ).rejects.toBeInstanceOf(ChatMembershipRequiredException)
                    })

                it("sending to a non-existent conversation id throws ChatConversationNotFoundException",
                    async () => {
                        const member = await seedUser("kc-chat-missing-conv")
                        await seedActiveMembership(member.id)

                        await expect(
                            chatService.sendMessage({
                                conversationId: "11111111-1111-4111-8111-111111111111",
                                body: "anyone there?",
                                user: member,
                            }),
                        ).rejects.toBeInstanceOf(ChatConversationNotFoundException)
                    })
            })

        describe("founder DM — private-access check",
            () => {
                it("the owning member can send in their OWN founder DM",
                    async () => {
                        const member = await seedUser("kc-chat-dm-owner")
                        await seedActiveMembership(member.id)
                        const dm = await chatService.getOrCreateFounderDm({
                            memberId: member.id,
                        })

                        const message = await chatService.sendMessage({
                            conversationId: dm.id,
                            body: "hi founder",
                            user: member,
                        })

                        expect(message.conversationId).toBe(dm.id)
                        expect(message.authorId).toBe(member.id)
                    })

                it("a DIFFERENT member (neither the DM owner nor the founder) is rejected with ChatForbiddenException and writes NO row",
                    async () => {
                        const owner = await seedUser("kc-chat-dm-owner-2")
                        await seedActiveMembership(owner.id)
                        const intruder = await seedUser("kc-chat-dm-intruder")
                        await seedActiveMembership(intruder.id)
                        const dm = await chatService.getOrCreateFounderDm({
                            memberId: owner.id,
                        })

                        await expect(
                            chatService.sendMessage({
                                conversationId: dm.id,
                                body: "let me read this DM",
                                user: intruder,
                            }),
                        ).rejects.toBeInstanceOf(ChatForbiddenException)

                        const count = await entityManager.count(ChatMessageEntity)
                        expect(count).toBe(0)
                    })

                it("the founder (matched by username, WITH their own active membership) can send in a member's DM despite not owning it",
                    async () => {
                        const member = await seedUser("kc-chat-dm-owner-3")
                        await seedActiveMembership(member.id)
                        const founder = await seedUser("kc-chat-founder",
                            FOUNDER_USERNAME)
                        await seedActiveMembership(founder.id)
                        const dm = await chatService.getOrCreateFounderDm({
                            memberId: member.id,
                        })

                        const message = await chatService.sendMessage({
                            conversationId: dm.id,
                            body: "hi, founder here",
                            user: founder,
                        })

                        expect(message.authorId).toBe(founder.id)
                        expect(message.conversationId).toBe(dm.id)
                    })

                it("the founder identity bypass does NOT bypass the membership gate — a founder-named user with NO active membership is still rejected",
                    async () => {
                        const member = await seedUser("kc-chat-dm-owner-4")
                        await seedActiveMembership(member.id)
                        // same username as the founder, but no membership row --
                        // isActive() is checked BEFORE the founder-identity check
                        const unpaidFounder = await seedUser("kc-chat-founder-unpaid",
                            FOUNDER_USERNAME)
                        const dm = await chatService.getOrCreateFounderDm({
                            memberId: member.id,
                        })

                        await expect(
                            chatService.sendMessage({
                                conversationId: dm.id,
                                body: "let me in anyway",
                                user: unpaidFounder,
                            }),
                        ).rejects.toBeInstanceOf(ChatMembershipRequiredException)
                    })

                it("one founder DM per member — getOrCreateFounderDm is idempotent across calls",
                    async () => {
                        const member = await seedUser("kc-chat-dm-idempotent")
                        await seedActiveMembership(member.id)

                        const first = await chatService.getOrCreateFounderDm({
                            memberId: member.id,
                        })
                        const second = await chatService.getOrCreateFounderDm({
                            memberId: member.id,
                        })

                        expect(second.id).toBe(first.id)
                        const dmCount = await entityManager.count(ChatConversationEntity,
                            {
                                where: {
                                    type: ChatConversationType.FounderDm,
                                    // `memberId` is a @RelationId virtual column -- not
                                    // queryable in `where`; filter through the real
                                    // `member` relation instead.
                                    member: {
                                        id: member.id,
                                    },
                                },
                            })
                        expect(dmCount).toBe(1)
                    })
            })
    })

/**
 * e2e for the chat READ resolvers (`chatMessages`, `myFounderConversation`,
 * `communityChatConversation`) -- driven over REAL HTTP through Apollo
 * (`ApolloServerModule` + `KeycloakAuthGraphQLGuard`), not the bare
 * `ChatService` calls above. All three require auth; `chatMessages` additionally
 * runs `ChatService.listMessages`'s real member-only + DM-ownership access check.
 * None of that guard/resolver wiring had ever been exercised -- the block above
 * calls `ChatService` directly, bypassing the GraphQL layer entirely.
 *
 * MOCKED: `EventEmitterService` (same as the block above -- no live NATS broker).
 *
 * REAL: Postgres (Testcontainers), the full Apollo/GraphQL stack, every resolver +
 * query service under test, `ChatService`, `MembershipService`, `DayjsService`.
 * `KeycloakAuthGraphQLGuard` is overridden with a fake `CanActivate` (mirrors
 * `progress-query.e2e-spec.ts`) since there is no live Keycloak server here.
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Chat GraphQL — chatMessages/myFounderConversation/communityChatConversation queries (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let chatService: ChatService

        /** The "logged in" user the overridden guard stamps onto the request; null = unauthenticated. */
        let currentUser: UserEntity | null = null

        // mirrors progress-query.e2e-spec.ts's fakeAuthGuard: denies (-> Nest's
        // default ForbiddenException) when nobody is "logged in".
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
            on: jest.fn(),
            off: jest.fn(),
        }

        const GRAPHQL_ENDPOINT = "/graphql"

        const CHAT_MESSAGES_QUERY = `
            query ChatMessagesRead($request: ChatMessagesRequest!) {
                chatMessages(request: $request) {
                    success
                    message
                    error
                    data {
                        items {
                            id
                            body
                            conversationId
                            isMine
                        }
                        nextCursor
                    }
                }
            }
        `
        const MY_FOUNDER_CONVERSATION_QUERY = `
            query MyFounderConversationRead {
                myFounderConversation {
                    success
                    message
                    error
                    data {
                        id
                        type
                    }
                }
            }
        `
        const COMMUNITY_CHAT_CONVERSATION_QUERY = `
            query CommunityChatConversationRead {
                communityChatConversation {
                    success
                    message
                    error
                    data {
                        id
                        type
                    }
                }
            }
        `

        const post = (query: string, variables?: Record<string, unknown>) =>
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
                    // REAL -- resolvers + their query services under test
                    ChatMessagesResolver,
                    ChatMessagesService,
                    MyFounderConversationResolver,
                    MyFounderConversationService,
                    CommunityChatConversationResolver,
                    CommunityChatConversationService,
                    // REAL -- the domain service + member-only gate the resolvers delegate to
                    ChatService,
                    MembershipService,
                    DayjsService,
                    {
                        provide: EventEmitterService,
                        useValue: eventEmitterServiceMock,
                    },
                ],
            })
                .overrideGuard(KeycloakAuthGraphQLGuard)
                .useValue(fakeAuthGuard)
                .compile()

            app = moduleRef.createNestApplication()
            await app.init()

            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            chatService = app.get(ChatService)
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE \"users\", \"memberships\", \"chat_conversations\", \"chat_messages\" RESTART IDENTITY CASCADE",
            )
            currentUser = null
            jest.clearAllMocks()
        })

        /** Seed a bare user, optionally with a username (unset when omitted). */
        const seedUser = async (
            keycloakId: string,
            username?: string,
        ): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId,
                        ...(username
                            ? {
                                username,
                            }
                            : {
                            }),
                    }),
            )

        /** Grant the user a REAL active membership (period ends 30 days out). */
        const seedActiveMembership = async (userId: string): Promise<void> => {
            const periodEnd = new Date()
            periodEnd.setDate(periodEnd.getDate() + 30)
            await entityManager.save(
                entityManager.create(MembershipEntity,
                    {
                        user: {
                            id: userId,
                        },
                        status: MembershipStatus.Active,
                        currentPeriodEnd: periodEnd,
                        autoRenew: false,
                    }),
            )
        }

        describe("chatMessages query",
            () => {
                it("an ACTIVE MEMBER lists the community room's messages (newest-first)",
                    async () => {
                        const member = await seedUser("kc-gql-chatmessages-member")
                        await seedActiveMembership(member.id)
                        const conversation = await chatService.getOrCreateCommunityConversation()
                        await chatService.sendMessage({
                            conversationId: conversation.id,
                            body: "first",
                            user: member,
                        })
                        await chatService.sendMessage({
                            conversationId: conversation.id,
                            body: "second",
                            user: member,
                        })

                        currentUser = member
                        const response = await post(CHAT_MESSAGES_QUERY,
                            {
                                request: {
                                    conversationId: conversation.id,
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.chatMessages
                        expect(body.success).toBe(true)
                        expect(body.data.items).toHaveLength(2)
                        // newest-first: "second" was sent after "first"
                        expect(body.data.items[0].body).toBe("second")
                        expect(body.data.items[0].isMine).toBe(true)
                        expect(body.data.nextCursor).toBeNull()
                    })

                it("not-a-member: a user with no active membership is rejected with ChatMembershipRequiredException, not a crash",
                    async () => {
                        const conversation = await chatService.getOrCreateCommunityConversation()
                        currentUser = await seedUser("kc-gql-chatmessages-nonmember")
                        // no membership row seeded -- never a member

                        const response = await post(CHAT_MESSAGES_QUERY,
                            {
                                request: {
                                    conversationId: conversation.id,
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.chatMessages
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("CHAT_MEMBERSHIP_REQUIRED_EXCEPTION")
                    })
            })

        describe("myFounderConversation query",
            () => {
                it("an AUTHENTICATED member's founder DM is lazily created and stays the SAME conversation across calls",
                    async () => {
                        currentUser = await seedUser("kc-gql-my-founder-conv-member")
                        await seedActiveMembership(currentUser.id)

                        const first = await post(MY_FOUNDER_CONVERSATION_QUERY)
                        const firstBody = first.body.data.myFounderConversation
                        expect(firstBody.success).toBe(true)
                        expect(firstBody.data.type).toBe("founderDm")

                        const second = await post(MY_FOUNDER_CONVERSATION_QUERY)
                        expect(second.body.data.myFounderConversation.data.id).toBe(firstBody.data.id)

                        const dmCount = await entityManager.count(ChatConversationEntity,
                            {
                                where: {
                                    type: ChatConversationType.FounderDm,
                                },
                            })
                        expect(dmCount).toBe(1)
                    })

                it("auth denied: an UNAUTHENTICATED request is rejected before the resolver runs",
                    async () => {
                        // currentUser left null -- the auth guard must deny before the query runs
                        const response = await post(MY_FOUNDER_CONVERSATION_QUERY)

                        expect(response.body.errors).toBeDefined()
                        expect(response.body.errors.length).toBeGreaterThan(0)
                    })
            })

        describe("communityChatConversation query",
            () => {
                it("returns the SAME singleton community room across different authenticated viewers",
                    async () => {
                        const viewerA = await seedUser("kc-gql-community-conv-a")
                        const viewerB = await seedUser("kc-gql-community-conv-b")

                        currentUser = viewerA
                        const first = await post(COMMUNITY_CHAT_CONVERSATION_QUERY)
                        const firstBody = first.body.data.communityChatConversation
                        expect(firstBody.success).toBe(true)
                        expect(firstBody.data.type).toBe("community")

                        currentUser = viewerB
                        const second = await post(COMMUNITY_CHAT_CONVERSATION_QUERY)
                        expect(second.body.data.communityChatConversation.data.id).toBe(firstBody.data.id)

                        const roomCount = await entityManager.count(ChatConversationEntity,
                            {
                                where: {
                                    type: ChatConversationType.Community,
                                },
                            })
                        expect(roomCount).toBe(1)
                    })

                it("auth denied: an UNAUTHENTICATED request is rejected before the resolver runs",
                    async () => {
                        const response = await post(COMMUNITY_CHAT_CONVERSATION_QUERY)

                        expect(response.body.errors).toBeDefined()
                        expect(response.body.errors.length).toBeGreaterThan(0)
                    })
            })
    })
