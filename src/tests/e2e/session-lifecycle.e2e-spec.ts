import {
    CommandBus,
    QueryBus,
} from "@nestjs/cqrs"
import {
    JwtService,
} from "@nestjs/jwt"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    KeycloakTokenService,
} from "@modules/integrations/keycloak/token.service"
import {
    RefreshTokenCoalescerService,
} from "@features/api/core/graphql/mutations/keycloak/refresh-token/refresh-token-coalescer.service"
import {
    RefreshTokenCommand,
} from "@features/api/core/graphql/mutations/keycloak/refresh-token/refresh-token.command"
import {
    RefreshTokenHandler,
} from "@features/api/core/graphql/mutations/keycloak/refresh-token/refresh-token.handler"
import {
    SignOutCommand,
} from "@features/api/core/graphql/mutations/keycloak/sign-out/sign-out.command"
import {
    SignOutHandler,
} from "@features/api/core/graphql/mutations/keycloak/sign-out/sign-out.handler"
import {
    MeHandler,
} from "@features/api/core/graphql/queries/authentication/me/me.handler"
import {
    MeQuery,
} from "@features/api/core/graphql/queries/authentication/me/me.query"
import {
    bootFlowWorld,
} from "@tests/helpers/flow-world"
import type {
    FlowWorld,
} from "@tests/helpers/flow-world"

/** A learner rotates a session, uses it, signs out, and cannot revive it. */
describe("a learner refreshes a session, signs out, and cannot reuse it",
    () => {
        const INITIAL_REFRESH_TOKEN = "refresh-session-1"
        const KEYCLOAK_ID = "kc-session-lifecycle-flow"

        let world: FlowWorld
        let commandBus: CommandBus
        let queryBus: QueryBus
        let learner: UserEntity
        let currentRefreshToken = INITIAL_REFRESH_TOKEN
        let tokenSequence = 1
        const activeRefreshTokens = new Set([INITIAL_REFRESH_TOKEN])

        const exchangeRefreshToken = jest.fn(async (
            params: {
                refreshToken: string
            },
        ) => {
            if (!activeRefreshTokens.delete(params.refreshToken)) {
                throw new Error("invalid refresh token")
            }
            tokenSequence += 1
            const refreshToken = `refresh-session-${tokenSequence}`
            activeRefreshTokens.add(refreshToken)
            return {
                access_token: `access-session-${tokenSequence}`,
                refresh_token: refreshToken,
            }
        })

        beforeAll(async () => {
            world = await bootFlowWorld({
                providers: [
                    RefreshTokenHandler,
                    SignOutHandler,
                    MeHandler,
                    {
                        provide: RefreshTokenCoalescerService,
                        useValue: {
                            exchange: exchangeRefreshToken,
                        },
                    },
                    {
                        provide: KeycloakTokenService,
                        useValue: {
                            revokeRefreshToken: jest.fn(async (
                                params: {
                                    refreshToken: string
                                },
                            ) => {
                                activeRefreshTokens.delete(params.refreshToken)
                            }),
                        },
                    },
                    {
                        provide: JwtService,
                        useValue: {
                            decode: jest.fn(),
                        },
                    },
                ],
            })
            commandBus = world.app.get(CommandBus)
            queryBus = world.app.get(QueryBus)
            await world.truncate("users")
            learner = await world.entityManager.save(
                world.entityManager.create(UserEntity,
                    {
                        keycloakId: KEYCLOAK_ID,
                        email: "session-learner@starci.test",
                        username: "session-learner",
                    }),
            )
        })

        afterAll(async () => {
            await world?.close()
        })

        it("rotates the initial refresh token",
            async () => {
                const refreshed = await commandBus.execute(
                    new RefreshTokenCommand({
                        refreshToken: currentRefreshToken,
                        request: {
                        },
                    }),
                )

                expect(refreshed.data.accessToken).toBe("access-session-2")
                currentRefreshToken = refreshed.refreshToken
                expect(currentRefreshToken).toBe("refresh-session-2")
                expect(activeRefreshTokens.has(INITIAL_REFRESH_TOKEN)).toBe(false)
            })

        it("uses the authenticated identity and rotates the live token again",
            async () => {
                const me = await queryBus.execute(
                    new MeQuery({
                        request: undefined,
                        user: learner,
                    }),
                )
                expect(me.id).toBe(learner.id)

                const refreshed = await commandBus.execute(
                    new RefreshTokenCommand({
                        refreshToken: currentRefreshToken,
                        request: {
                        },
                    }),
                )
                currentRefreshToken = refreshed.refreshToken
                expect(refreshed.data.accessToken).toBe("access-session-3")
            })

        it("revokes the current refresh token on sign-out",
            async () => {
                await commandBus.execute(
                    new SignOutCommand({
                        request: {
                            refreshToken: currentRefreshToken,
                        },
                    }),
                )

                expect(activeRefreshTokens.has(currentRefreshToken)).toBe(false)
            })

        it("rejects an attempt to refresh the signed-out session",
            async () => {
                await expect(commandBus.execute(
                    new RefreshTokenCommand({
                        refreshToken: currentRefreshToken,
                        request: {
                        },
                    }),
                )).rejects.toThrow("invalid refresh token")
            })
    })
