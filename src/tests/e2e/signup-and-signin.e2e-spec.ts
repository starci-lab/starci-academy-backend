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
    EmailBloomFilterService,
} from "@modules/bussiness/bloom-filters/email.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    OtpChallengeService,
} from "@modules/integrations/code/otp-challenge.service"
import {
    KeycloakTokenService,
} from "@modules/integrations/keycloak/token.service"
import {
    KeycloakUserService,
} from "@modules/integrations/keycloak/user.service"
import {
    TotpService,
} from "@modules/integrations/totp/totp.service"
import {
    ChallengeOtpMismatchException,
} from "@modules/platform/exceptions/errors/users/otp"
import {
    SignUpInitCommand,
} from "@features/api/core/graphql/mutations/keycloak/sign-up/init/sign-up-init.command"
import {
    SignUpInitHandler,
} from "@features/api/core/graphql/mutations/keycloak/sign-up/init/sign-up-init.handler"
import {
    SignUpVerifyOtpCommand,
} from "@features/api/core/graphql/mutations/keycloak/sign-up/verify-otp/sign-up-verify-otp.command"
import {
    SignUpVerifyOtpHandler,
} from "@features/api/core/graphql/mutations/keycloak/sign-up/verify-otp/sign-up-verify-otp.handler"
import {
    SignInInitCommand,
} from "@features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.command"
import {
    SignInInitHandler,
} from "@features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.handler"
import {
    SignInVerifyOtpCommand,
} from "@features/api/core/graphql/mutations/keycloak/sign-in/verify-otp/sign-in-verify-otp.command"
import {
    SignInVerifyOtpHandler,
} from "@features/api/core/graphql/mutations/keycloak/sign-in/verify-otp/sign-in-verify-otp.handler"
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

interface StoredChallenge {
    email: string
    otp: string
    payload: unknown
}

interface VerifyChallengeInput {
    challengeId: string
    otp: string
}

/**
 * A stranger registers, verifies, signs in, and can read their authenticated identity.
 *
 * Keycloak and mail are process boundaries, so their clients are deterministic
 * doubles. CQRS registration, OTP state transitions, and the local user row are
 * exercised through the real command/query bus and PostgreSQL.
 */
describe("a stranger registers, verifies, signs in, and can read their identity",
    () => {
        const EMAIL = "new-learner@starci.test"
        const PASSWORD = "correct-horse-battery"
        const KEYCLOAK_ID = "kc-signup-and-signin-flow"
        const ACCESS_TOKEN = "access-signup-and-signin-flow"
        const REFRESH_TOKEN = "refresh-signup-and-signin-flow"

        let world: FlowWorld
        let commandBus: CommandBus
        let queryBus: QueryBus
        let signUpChallengeId: string
        let signInChallengeId: string
        let learner: UserEntity
        let challengeSequence = 0
        const challenges = new Map<string, StoredChallenge>()
        const sentMail = jest.fn().mockResolvedValue(undefined)

        const otpChallengeService = {
            createActionChallenge: jest.fn(async (
                params: {
                    email: string
                    payload: unknown
                },
            ) => {
                challengeSequence += 1
                const challengeId = `challenge-${challengeSequence}`
                const otp = challengeSequence === 1 ? "111111" : "222222"
                challenges.set(challengeId,
                    {
                        email: params.email,
                        otp,
                        payload: params.payload,
                    })
                return {
                    challengeId,
                    otp,
                    expiresInSeconds: 300,
                }
            }),
            verifyActionChallenge: jest.fn(async (
                {
                    challengeId,
                    otp,
                }: VerifyChallengeInput,
            ) => {
                const challenge = challenges.get(challengeId)
                if (!challenge) {
                    return {
                        mismatch: false,
                        attemptsLeft: 0,
                        notFound: true,
                    }
                }
                if (challenge.otp !== otp) {
                    return {
                        mismatch: true,
                        attemptsLeft: 4,
                        notFound: false,
                    }
                }
                challenges.delete(challengeId)
                return {
                    email: challenge.email,
                    payload: challenge.payload,
                    mismatch: false,
                    attemptsLeft: 5,
                    notFound: false,
                }
            }),
        }

        beforeAll(async () => {
            world = await bootFlowWorld({
                providers: [
                    SignUpInitHandler,
                    SignUpVerifyOtpHandler,
                    SignInInitHandler,
                    SignInVerifyOtpHandler,
                    MeHandler,
                    {
                        provide: OtpChallengeService,
                        useValue: otpChallengeService,
                    },
                    {
                        provide: KeycloakTokenService,
                        useValue: {
                            registerUserWithPassword: jest.fn().mockResolvedValue(KEYCLOAK_ID),
                            exchangePasswordForToken: jest.fn().mockResolvedValue({
                                access_token: ACCESS_TOKEN,
                                refresh_token: REFRESH_TOKEN,
                            }),
                        },
                    },
                    {
                        provide: KeycloakUserService,
                        useValue: {
                            getUserByUsername: jest.fn().mockResolvedValue(null),
                            setUserEmailVerified: jest.fn().mockResolvedValue(undefined),
                        },
                    },
                    {
                        provide: TotpService,
                        useValue: {
                            verify: jest.fn(),
                        },
                    },
                    {
                        provide: JwtService,
                        useValue: {
                            decode: jest.fn(() => ({
                                sub: KEYCLOAK_ID,
                                email: EMAIL,
                                preferred_username: "new-learner",
                            })),
                        },
                    },
                    {
                        provide: EmailBloomFilterService,
                        useValue: {
                            add: jest.fn().mockResolvedValue(undefined),
                        },
                    },
                    {
                        provide: EnqueueSendMailJobService,
                        useValue: {
                            enqueue: sentMail,
                        },
                    },
                ],
            })
            commandBus = world.app.get(CommandBus)
            queryBus = world.app.get(QueryBus)
            await world.truncate("users")
        })

        afterAll(async () => {
            await world?.close()
        })

        it("starts registration and sends the verification code without creating a local user",
            async () => {
                const initiated = await commandBus.execute(
                    new SignUpInitCommand({
                        request: {
                            email: EMAIL,
                            password: PASSWORD,
                            username: "new-learner",
                            firstName: "New",
                            lastName: "Learner",
                        },
                    }),
                )
                signUpChallengeId = initiated.challengeId

                expect(await world.entityManager.count(UserEntity)).toBe(0)
                expect(sentMail).toHaveBeenCalledWith(
                    expect.objectContaining({
                        template: "sign-up-otp",
                        context: expect.objectContaining({
                            otp: "111111",
                        }),
                    }),
                )
            })

        it("rejects a wrong verification code and still creates no user",
            async () => {
                await expect(commandBus.execute(
                    new SignUpVerifyOtpCommand({
                        request: {
                            challengeId: signUpChallengeId,
                            otp: "999999",
                        },
                    }),
                )).rejects.toBeInstanceOf(ChallengeOtpMismatchException)
                expect(await world.entityManager.count(UserEntity)).toBe(0)
            })

        it("consumes the right code, creates the local identity, and returns a session token",
            async () => {
                const verified = await commandBus.execute(
                    new SignUpVerifyOtpCommand({
                        request: {
                            challengeId: signUpChallengeId,
                            otp: "111111",
                        },
                    }),
                )
                expect(verified.data.accessToken).toBe(ACCESS_TOKEN)

                learner = await world.entityManager.findOneOrFail(UserEntity,
                    {
                        where: {
                            keycloakId: KEYCLOAK_ID,
                        },
                    })
                expect(learner.email).toBe(EMAIL)
                expect(learner.username).toBe("new-learner")
            })

        it("checks the password again and sends a fresh sign-in code",
            async () => {
                const initiated = await commandBus.execute(
                    new SignInInitCommand({
                        request: {
                            email: EMAIL,
                            password: PASSWORD,
                        },
                    }),
                )
                signInChallengeId = initiated.challengeId
                expect(signInChallengeId).not.toBe(signUpChallengeId)
                expect(sentMail).toHaveBeenCalledWith(
                    expect.objectContaining({
                        template: "sign-in-otp",
                        context: expect.objectContaining({
                            otp: "222222",
                        }),
                    }),
                )
            })

        it("finishes sign-in and the authenticated me query returns the same local identity",
            async () => {
                const signedIn = await commandBus.execute(
                    new SignInVerifyOtpCommand({
                        request: {
                            challengeId: signInChallengeId,
                            otp: "222222",
                        },
                    }),
                )
                expect(signedIn.data.accessToken).toBe(ACCESS_TOKEN)

                const me = await queryBus.execute(
                    new MeQuery({
                        request: undefined,
                        user: learner,
                    }),
                )
                expect(me.id).toBe(learner.id)
                expect(me.keycloakId).toBe(KEYCLOAK_ID)
            })
    })
