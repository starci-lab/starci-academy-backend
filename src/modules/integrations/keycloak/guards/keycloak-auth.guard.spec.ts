import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    UnauthorizedException,
} from "@nestjs/common"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    GraphQLContextMissingRequestException,
} from "@modules/platform/exceptions/errors/keycloak/graphql-context-missing-request"
import {
    KeycloakAuthHeaderInvalidFormatException,
} from "@modules/platform/exceptions/errors/keycloak/keycloak-auth-header-invalid-format"
import {
    KeycloakAuthHeaderMissingException,
} from "@modules/platform/exceptions/errors/keycloak/keycloak-auth-header-missing"
import {
    KeycloakTokenInactiveException,
} from "@modules/platform/exceptions/errors/keycloak/keycloak-token-inactive"
import {
    KeycloakJwksService,
} from "../jwks.service"
import {
    SessionService,
} from "@modules/platform/session/session.service"
import {
    CookieService,
} from "@modules/platform/cookie/cookie.service"
import {
    makeEntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
import {
    KeycloakAuthRestGuard,
} from "./keycloak-auth-rest.guard"
import {
    KeycloakAuthGraphQLGuard,
} from "./keycloak-auth-graphql.guard"
import {
    KeycloakOptionalAuthGraphQLGuard,
} from "./keycloak-optional-auth-graphql.guard"
import {
    UserService,
} from "../../bussiness/user"
import type {
    ExecutionContext,
} from "@nestjs/common"
import type {
    EntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** A keycloak subject id reused across the auth tests. */
const KEYCLOAK_SUB = "kc-sub-1"

/**
 * Build a REST {@link ExecutionContext} whose `switchToHttp().getRequest()`
 * returns the supplied request object -- the only context surface the REST
 * guard reads.
 */
const buildHttpContext = (
    request: Record<string, unknown>,
): ExecutionContext => ({
    switchToHttp: () => ({
        getRequest: () => request,
    }),
}) as unknown as ExecutionContext

/**
 * Build a GraphQL {@link ExecutionContext}. `GqlExecutionContext.create` reads
 * the resolver args via `getArgs()` and exposes `getContext()` as index 2 --
 * the `[root, args, ctx, info]` tuple, with `ctx.req` carrying the request.
 */
const buildGqlContext = (
    request: Record<string, unknown> | undefined,
): ExecutionContext => ({
    getArgs: () => [
        undefined,
        undefined,
        {
            req: request,
        },
        undefined,
    ],
    getClass: () => class {
    },
    getHandler: () => () => undefined,
    getType: () => "graphql",
}) as unknown as ExecutionContext

describe("Keycloak auth guards",
    () => {
        let module: TestingModule
        let restGuard: KeycloakAuthRestGuard
        let graphqlGuard: KeycloakAuthGraphQLGuard
        let optionalGuard: KeycloakOptionalAuthGraphQLGuard
        let entityManager: EntityManagerMock
        let keycloakJwksService: jest.Mocked<Pick<KeycloakJwksService, "verifyAccessToken">>
        let sessionService: jest.Mocked<Pick<SessionService, "assertCurrent">>
        let cookieService: jest.Mocked<Pick<CookieService, "getCookie">>
        let userService: jest.Mocked<Pick<UserService, "getUserByKeycloakId">>

        beforeEach(async () => {
            // fresh entity manager -- findOne returns null by default (new user path)
            entityManager = makeEntityManagerMock()

            // happy-path introspection: token is active and carries a subject
            keycloakJwksService = {
                verifyAccessToken: jest.fn(async () => ({
                    active: true,
                    sub: KEYCLOAK_SUB,
                    preferred_username: "bob",
                    email: "bob@example.com",
                })),
            } as unknown as jest.Mocked<Pick<KeycloakJwksService, "verifyAccessToken">>

            // session assertion resolves (current device still wins) by default
            sessionService = {
                assertCurrent: jest.fn(async () => undefined),
            } as unknown as jest.Mocked<Pick<SessionService, "assertCurrent">>

            // cookie lookup hands back a session id by default
            cookieService = {
                getCookie: jest.fn(() => "session-1"),
            } as unknown as jest.Mocked<Pick<CookieService, "getCookie">>

            // optional guard resolves an existing user for a valid token
            userService = {
                getUserByKeycloakId: jest.fn(async () => ({
                    id: "user-1",
                })),
            } as unknown as jest.Mocked<Pick<UserService, "getUserByKeycloakId">>

            module = await Test.createTestingModule({
                providers: [
                    KeycloakAuthRestGuard,
                    KeycloakAuthGraphQLGuard,
                    KeycloakOptionalAuthGraphQLGuard,
                    {
                        provide: KeycloakJwksService,
                        useValue: keycloakJwksService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: SessionService,
                        useValue: sessionService,
                    },
                    {
                        provide: CookieService,
                        useValue: cookieService,
                    },
                    {
                        provide: UserService,
                        useValue: userService,
                    },
                ],
            }).compile()

            restGuard = module.get<KeycloakAuthRestGuard>(KeycloakAuthRestGuard)
            graphqlGuard = module.get<KeycloakAuthGraphQLGuard>(KeycloakAuthGraphQLGuard)
            optionalGuard = module.get<KeycloakOptionalAuthGraphQLGuard>(
                KeycloakOptionalAuthGraphQLGuard,
            )
        })

        afterEach(async () => {
            await module.close()
        })

        describe("KeycloakAuthRestGuard (abstract canActivate)",
            () => {
                it("allows a valid Bearer token and loads the existing user",
                    async () => {
                        // an existing user is already provisioned
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "user-1",
                            keycloakId: KEYCLOAK_SUB,
                        })
                        const request: Record<string, unknown> = {
                            headers: {
                                authorization: "Bearer good-token",
                            },
                        }

                        const allowed = await restGuard.canActivate(
                            buildHttpContext(request),
                        )

                        expect(allowed).toBe(true)
                        // the loaded user is attached for downstream handlers
                        expect(request.user).toEqual({
                            id: "user-1",
                            keycloakId: KEYCLOAK_SUB,
                        })
                        // no create when the row already exists
                        expect(entityManager.create).not.toHaveBeenCalled()
                        // single-session enforcement ran with the cookie session id
                        expect(sessionService.assertCurrent).toHaveBeenCalledWith({
                            userId: KEYCLOAK_SUB,
                            sessionId: "session-1",
                        })
                    })

                it("lazily creates the user on first login",
                    async () => {
                        // findOne returns null -> guard must create + save the user
                        const request = {
                            headers: {
                                authorization: "Bearer good-token",
                            },
                        }

                        const allowed = await restGuard.canActivate(
                            buildHttpContext(request),
                        )

                        expect(allowed).toBe(true)
                        expect(entityManager.create).toHaveBeenCalled()
                        expect(entityManager.save).toHaveBeenCalled()
                    })

                it("throws when the Authorization header is missing",
                    async () => {
                        // no headers at all -> cannot authenticate
                        await expect(
                            restGuard.canActivate(
                                buildHttpContext({
                                    headers: {
                                    },
                                }),
                            ),
                        ).rejects.toBeInstanceOf(KeycloakAuthHeaderMissingException)
                        // verification is never attempted without a token
                        expect(keycloakJwksService.verifyAccessToken).not.toHaveBeenCalled()
                    })

                it("throws when the scheme is not Bearer",
                    async () => {
                        // a Basic credential is rejected before introspection
                        await expect(
                            restGuard.canActivate(
                                buildHttpContext({
                                    headers: {
                                        authorization: "Basic abc",
                                    },
                                }),
                            ),
                        ).rejects.toBeInstanceOf(KeycloakAuthHeaderInvalidFormatException)
                    })

                it("throws when introspection reports an inactive token",
                    async () => {
                        // expired / revoked tokens come back active: false
                        keycloakJwksService.verifyAccessToken.mockResolvedValueOnce({
                            active: false,
                        })

                        await expect(
                            restGuard.canActivate(
                                buildHttpContext({
                                    headers: {
                                        authorization: "Bearer expired-token",
                                    },
                                }),
                            ),
                        ).rejects.toBeInstanceOf(KeycloakTokenInactiveException)
                    })

                it("propagates a superseded-session rejection",
                    async () => {
                        // a newer login elsewhere makes assertCurrent throw 401
                        sessionService.assertCurrent.mockRejectedValueOnce(
                            new UnauthorizedException("Session superseded"),
                        )
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "user-1",
                        })

                        await expect(
                            restGuard.canActivate(
                                buildHttpContext({
                                    headers: {
                                        authorization: "Bearer good-token",
                                    },
                                }),
                            ),
                        ).rejects.toBeInstanceOf(UnauthorizedException)
                    })
            })

        describe("KeycloakAuthGraphQLGuard (getRequest)",
            () => {
                it("reads the request off the GraphQL context and allows a valid token",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "user-1",
                        })
                        const request = {
                            headers: {
                                authorization: "Bearer good-token",
                            },
                        }

                        const allowed = await graphqlGuard.canActivate(
                            buildGqlContext(request),
                        )

                        expect(allowed).toBe(true)
                    })

                it("throws when the GraphQL context has no HTTP request",
                    async () => {
                        // a subscription / missing-req context cannot be authed
                        await expect(
                            graphqlGuard.canActivate(
                                buildGqlContext(undefined),
                            ),
                        ).rejects.toBeInstanceOf(GraphQLContextMissingRequestException)
                    })
            })

        describe("KeycloakOptionalAuthGraphQLGuard",
            () => {
                it("allows an anonymous request and leaves req.user unset",
                    async () => {
                        // no Authorization header -> anonymous path is permitted
                        const request: Record<string, unknown> = {
                            headers: {
                            },
                        }

                        const allowed = await optionalGuard.canActivate(
                            buildGqlContext(request),
                        )

                        expect(allowed).toBe(true)
                        // anonymous: user is never resolved
                        expect(userService.getUserByKeycloakId).not.toHaveBeenCalled()
                        expect(request.user).toBeUndefined()
                    })

                it("resolves and attaches the user when a valid token is present",
                    async () => {
                        const request: Record<string, unknown> = {
                            headers: {
                                authorization: "Bearer good-token",
                            },
                        }

                        const allowed = await optionalGuard.canActivate(
                            buildGqlContext(request),
                        )

                        expect(allowed).toBe(true)
                        expect(userService.getUserByKeycloakId).toHaveBeenCalledWith(
                            KEYCLOAK_SUB,
                        )
                        expect(request.user).toEqual({
                            id: "user-1",
                        })
                    })

                it("rejects a malformed Authorization header even in optional mode",
                    async () => {
                        // a present-but-broken header is still a hard 401
                        await expect(
                            optionalGuard.canActivate(
                                buildGqlContext({
                                    headers: {
                                        authorization: "Bearer",
                                    },
                                }),
                            ),
                        ).rejects.toBeInstanceOf(KeycloakAuthHeaderInvalidFormatException)
                    })

                it("rejects a present-but-inactive token",
                    async () => {
                        // a supplied token that fails introspection is rejected
                        keycloakJwksService.verifyAccessToken.mockResolvedValueOnce({
                            active: false,
                        })

                        await expect(
                            optionalGuard.canActivate(
                                buildGqlContext({
                                    headers: {
                                        authorization: "Bearer bad-token",
                                    },
                                }),
                            ),
                        ).rejects.toBeInstanceOf(KeycloakTokenInactiveException)
                    })

                it("throws when the GraphQL context has no HTTP request",
                    async () => {
                        await expect(
                            optionalGuard.canActivate(
                                buildGqlContext(undefined),
                            ),
                        ).rejects.toBeInstanceOf(GraphQLContextMissingRequestException)
                    })
            })
    })
