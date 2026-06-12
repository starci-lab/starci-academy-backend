// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` — dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness"
import {
    OtpChallengeService,
} from "@modules/code"
import {
    KeycloakTokenService,
    KeycloakUserService,
} from "@modules/keycloak"
import {
    UserEmailAlreadyVerifiedException,
} from "@modules/exceptions"
import {
    SignUpInitCommand,
} from "./sign-up-init.command"
import {
    SignUpInitHandler,
} from "./sign-up-init.handler"

describe("SignUpInitHandler",
    () => {
        let module: TestingModule
        let handler: SignUpInitHandler
        let otpChallengeService: jest.Mocked<Pick<OtpChallengeService, "createActionChallenge">>
        let enqueueSendMailJobService: jest.Mocked<Pick<EnqueueSendMailJobService, "enqueue">>
        let keycloakTokenService: jest.Mocked<Pick<KeycloakTokenService, "registerUserWithPassword">>
        let keycloakUserService: jest.Mocked<Pick<KeycloakUserService, "getUserByUsername">>

        beforeEach(async () => {
            // OTP challenge issuer — returns the new challenge handle + otp code
            otpChallengeService = {
                createActionChallenge: jest.fn().mockResolvedValue({
                    challengeId: "chal-1",
                    otp: "123456",
                    expiresInSeconds: 120,
                }),
            } as unknown as jest.Mocked<Pick<OtpChallengeService, "createActionChallenge">>

            // mail worker hand-off — assert the OTP email is queued
            enqueueSendMailJobService = {
                enqueue: jest.fn(),
            } as unknown as jest.Mocked<Pick<EnqueueSendMailJobService, "enqueue">>

            // creates the Keycloak user when none pre-exists; returns its id
            keycloakTokenService = {
                registerUserWithPassword: jest.fn().mockResolvedValue("kc-new"),
            } as unknown as jest.Mocked<Pick<KeycloakTokenService, "registerUserWithPassword">>

            // looks up an existing Keycloak user by username (null by default)
            keycloakUserService = {
                getUserByUsername: jest.fn().mockResolvedValue(null),
            } as unknown as jest.Mocked<Pick<KeycloakUserService, "getUserByUsername">>

            module = await Test.createTestingModule({
                providers: [
                    SignUpInitHandler,
                    {
                        provide: OtpChallengeService,
                        useValue: otpChallengeService,
                    },
                    {
                        provide: EnqueueSendMailJobService,
                        useValue: enqueueSendMailJobService,
                    },
                    {
                        provide: KeycloakTokenService,
                        useValue: keycloakTokenService,
                    },
                    {
                        provide: KeycloakUserService,
                        useValue: keycloakUserService,
                    },
                ],
            }).compile()

            handler = module.get<SignUpInitHandler>(SignUpInitHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("registers a new Keycloak user, issues an OTP and queues the email",
            async () => {
                // no pre-existing Keycloak user for this username
                keycloakUserService.getUserByUsername.mockResolvedValueOnce(null)

                const result = await handler.execute(
                    new SignUpInitCommand({
                        request: {
                            email: "new@example.com",
                            password: "secret",
                            username: "newbie",
                        },
                    }),
                )

                // a fresh Keycloak account is created with the supplied credentials
                expect(keycloakTokenService.registerUserWithPassword).toHaveBeenCalledWith(
                    expect.objectContaining({
                        username: "newbie",
                        email: "new@example.com",
                        password: "secret",
                    }),
                )
                // the OTP challenge embeds the new Keycloak user id
                expect(otpChallengeService.createActionChallenge).toHaveBeenCalledWith(
                    expect.objectContaining({
                        email: "new@example.com",
                        payload: expect.objectContaining({
                            keycloakUserId: "kc-new",
                        }),
                    }),
                )
                // the sign-up OTP email is queued
                expect(enqueueSendMailJobService.enqueue).toHaveBeenCalledWith(
                    expect.objectContaining({
                        template: "sign-up-otp",
                    }),
                )
                expect(result).toEqual({
                    challengeId: "chal-1",
                    expiresInSeconds: 120,
                })
            })

        it("reuses an existing unverified Keycloak user instead of registering",
            async () => {
                // an account exists but its email is not verified yet
                keycloakUserService.getUserByUsername.mockResolvedValueOnce({
                    id: "kc-existing",
                    emailVerified: false,
                } as never)

                await handler.execute(
                    new SignUpInitCommand({
                        request: {
                            email: "again@example.com",
                            password: "secret",
                        },
                    }),
                )

                // no new account is created; the existing id is reused in the challenge
                expect(keycloakTokenService.registerUserWithPassword).not.toHaveBeenCalled()
                expect(otpChallengeService.createActionChallenge).toHaveBeenCalledWith(
                    expect.objectContaining({
                        payload: expect.objectContaining({
                            keycloakUserId: "kc-existing",
                        }),
                    }),
                )
            })

        it("throws when the email is already verified (no OTP issued)",
            async () => {
                // the account already completed verification → sign-up is rejected
                keycloakUserService.getUserByUsername.mockResolvedValueOnce({
                    id: "kc-existing",
                    emailVerified: true,
                } as never)

                await expect(
                    handler.execute(
                        new SignUpInitCommand({
                            request: {
                                email: "done@example.com",
                                password: "secret",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(UserEmailAlreadyVerifiedException)

                // neither registration, challenge, nor email runs
                expect(keycloakTokenService.registerUserWithPassword).not.toHaveBeenCalled()
                expect(otpChallengeService.createActionChallenge).not.toHaveBeenCalled()
                expect(enqueueSendMailJobService.enqueue).not.toHaveBeenCalled()
            })
    })
