import {
    Test,
} from "@nestjs/testing"
import type {
    INestApplication,
} from "@nestjs/common"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    PrimaryPostgreSQLModule,
    UserEntity,
} from "@modules/databases"
import {
    TwoFactorInvalidCodeException,
} from "@modules/exceptions"
import {
    EncryptionService,
} from "@modules/crypto"
import type {
    DecryptParams,
    EncryptParams,
    EncryptResult,
} from "@modules/crypto"
import {
    TotpService,
} from "@modules/totp"
import type {
    VerifyTotpParams,
} from "@modules/totp"
import {
    KeycloakJwksService,
} from "@modules/keycloak"
import {
    SessionService,
} from "@modules/session"
import {
    CookieService,
} from "@modules/cookie"
import {
    SetupTwoFactorResolver,
} from "@features/api/core/graphql/mutations/two-factor/setup-two-factor/setup-two-factor.resolver"
import {
    ConfirmTwoFactorResolver,
} from "@features/api/core/graphql/mutations/two-factor/confirm-two-factor/confirm-two-factor.resolver"
import {
    DisableTwoFactorResolver,
} from "@features/api/core/graphql/mutations/two-factor/disable-two-factor/disable-two-factor.resolver"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** The one code the stubbed {@link TotpService.verify} accepts. */
const VALID_CODE = "111111"
/** Any other 6-digit code — always rejected by the stub. */
const INVALID_CODE = "222222"
/** Fixed secret the stubbed {@link TotpService.generateSecret} always returns. */
const FIXED_SECRET = "JBSWY3DPEHPK3PXP"

/**
 * e2e for the TOTP two-factor lifecycle (setup → confirm → disable) —
 * `.claude/canon/be/enforce/authoring/testing.md` §2 coverage rule: every
 * mutation that commits a row a user later sees earns an e2e. Runs the three
 * resolvers directly against REAL Postgres (Testcontainers), proving the
 * enrollment/confirm/disable state machine on the actual `users` row — not a
 * mocked `EntityManager`.
 *
 * MOCKED (external, per the task's explicit "stub keycloak/totp gen" scope):
 *  - `TotpService` — the real class is deterministic RFC-6238 math with no DI
 *    seam for "what code is valid right now"; stubbed so `verify()` accepts
 *    exactly {@link VALID_CODE} and rejects everything else, making the
 *    confirm/disable code-check paths deterministic instead of requiring the
 *    test to reimplement HMAC-based TOTP generation.
 *  - `EncryptionService` — the real class needs `MountStorageService`, which
 *    reads a mounted encryption key off disk; stubbed to a reversible
 *    base64 passthrough so `setupTwoFactor` → `confirmTwoFactor`'s
 *    encrypt-then-decrypt round trip still exercises the same code path the
 *    resolvers run, just with a fake cipher.
 *
 * REAL: Postgres (Testcontainers), `SetupTwoFactorResolver`,
 * `ConfirmTwoFactorResolver`, `DisableTwoFactorResolver`.
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Two-factor (TOTP) setup / confirm / disable (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let setupTwoFactorResolver: SetupTwoFactorResolver
        let confirmTwoFactorResolver: ConfirmTwoFactorResolver
        let disableTwoFactorResolver: DisableTwoFactorResolver

        beforeAll(async () => {
            const fakeEncryptionService: Pick<EncryptionService, "encrypt" | "decrypt"> = {
                // reversible base64 passthrough — not real crypto, just enough to
                // exercise the same encrypt-then-decrypt round trip the resolvers run
                encrypt: ({
                    plainText,
                }: EncryptParams): EncryptResult => ({
                    iv: "stub-iv",
                    authTag: "stub-auth-tag",
                    ciphertext: Buffer.from(plainText,
                        "utf8").toString("base64"),
                }),
                decrypt: ({
                    payload,
                }: DecryptParams): string =>
                    Buffer.from(payload.ciphertext,
                        "base64").toString("utf8"),
            }

            const fakeTotpService: Pick<TotpService, "generateSecret" | "generateKeyUri" | "verify"> = {
                generateSecret: () => FIXED_SECRET,
                generateKeyUri: ({
                    secret,
                    accountName,
                }) => `otpauth://totp/StarCi:${accountName}?secret=${secret}`,
                verify: ({
                    token,
                }: VerifyTotpParams): boolean => token === VALID_CODE,
            }

            const moduleRef = await Test.createTestingModule({
                imports: [
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                ],
                providers: [
                    // REAL — the three resolvers under test
                    SetupTwoFactorResolver,
                    ConfirmTwoFactorResolver,
                    DisableTwoFactorResolver,
                    {
                        provide: EncryptionService,
                        useValue: fakeEncryptionService,
                    },
                    {
                        provide: TotpService,
                        useValue: fakeTotpService,
                    },
                    // guard deps — the three resolvers under test carry
                    // `@UseGuards(KeycloakAuthGraphQLGuard)`, so Nest constructs the
                    // guard as an enhancer at `app.init()` even though these tests
                    // invoke `execute()` directly; its constructor deps must resolve
                    {
                        provide: KeycloakJwksService,
                        useValue: {
                        },
                    },
                    {
                        provide: SessionService,
                        useValue: {
                        },
                    },
                    {
                        provide: CookieService,
                        useValue: {
                        },
                    },
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            await app.init()

            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            setupTwoFactorResolver = app.get(SetupTwoFactorResolver)
            confirmTwoFactorResolver = app.get(ConfirmTwoFactorResolver)
            disableTwoFactorResolver = app.get(DisableTwoFactorResolver)
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE \"users\" RESTART IDENTITY CASCADE",
            )
        })

        /** Seed a minimal user row, optionally with 2FA already enrolled. */
        const seedUser = async (
            keycloakId: string,
            overrides: Partial<UserEntity> = {
            },
        ): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId,
                        username: keycloakId,
                        twoFactorEnabled: false,
                        twoFactorSecret: null,
                        ...overrides,
                    }),
            )

        it("setupTwoFactor stores the encrypted pending secret and forces the flag off",
            async () => {
                const user = await seedUser("kc-2fa-setup",
                    {
                        email: "stacy@starci.dev",
                    })

                const data = await setupTwoFactorResolver.execute(user)

                expect(data.secret).toBe(FIXED_SECRET)
                expect(data.otpauthUrl).toContain(FIXED_SECRET)

                const reloaded = await entityManager.findOneByOrFail(UserEntity,
                    {
                        id: user.id,
                    })
                expect(reloaded.twoFactorEnabled).toBe(false)
                expect(reloaded.twoFactorSecret).not.toBeNull()
                // the stored secret is the ENCRYPTED payload, never the raw base32 secret
                expect(reloaded.twoFactorSecret).not.toContain(FIXED_SECRET)
            })

        it("confirmTwoFactor with a valid code promotes the pending secret and enables the flag",
            async () => {
                const user = await seedUser("kc-2fa-confirm-ok")
                await setupTwoFactorResolver.execute(user)
                const afterSetup = await entityManager.findOneByOrFail(UserEntity,
                    {
                        id: user.id,
                    })

                await confirmTwoFactorResolver.execute(
                    {
                        code: VALID_CODE,
                    },
                    afterSetup,
                )

                const reloaded = await entityManager.findOneByOrFail(UserEntity,
                    {
                        id: user.id,
                    })
                expect(reloaded.twoFactorEnabled).toBe(true)
                // the secret itself is untouched by confirm — only the flag flips
                expect(reloaded.twoFactorSecret).toBe(afterSetup.twoFactorSecret)
            })

        it("confirmTwoFactor with a wrong code rejects and leaves the flag disabled",
            async () => {
                const user = await seedUser("kc-2fa-confirm-bad")
                await setupTwoFactorResolver.execute(user)
                const afterSetup = await entityManager.findOneByOrFail(UserEntity,
                    {
                        id: user.id,
                    })

                await expect(
                    confirmTwoFactorResolver.execute(
                        {
                            code: INVALID_CODE,
                        },
                        afterSetup,
                    ),
                ).rejects.toBeInstanceOf(TwoFactorInvalidCodeException)

                const reloaded = await entityManager.findOneByOrFail(UserEntity,
                    {
                        id: user.id,
                    })
                expect(reloaded.twoFactorEnabled).toBe(false)
            })

        it("confirmTwoFactor with no prior setupTwoFactor call rejects (nothing pending)",
            async () => {
                const user = await seedUser("kc-2fa-confirm-nothing-pending")

                await expect(
                    confirmTwoFactorResolver.execute(
                        {
                            code: VALID_CODE,
                        },
                        user,
                    ),
                ).rejects.toBeInstanceOf(TwoFactorInvalidCodeException)

                const reloaded = await entityManager.findOneByOrFail(UserEntity,
                    {
                        id: user.id,
                    })
                expect(reloaded.twoFactorEnabled).toBe(false)
            })

        it("disableTwoFactor with a valid code clears both the flag and the secret",
            async () => {
                const user = await seedUser("kc-2fa-disable-ok")
                await setupTwoFactorResolver.execute(user)
                const afterSetup = await entityManager.findOneByOrFail(UserEntity,
                    {
                        id: user.id,
                    })
                await confirmTwoFactorResolver.execute(
                    {
                        code: VALID_CODE,
                    },
                    afterSetup,
                )
                const enabled = await entityManager.findOneByOrFail(UserEntity,
                    {
                        id: user.id,
                    })

                await disableTwoFactorResolver.execute(
                    {
                        code: VALID_CODE,
                    },
                    enabled,
                )

                const reloaded = await entityManager.findOneByOrFail(UserEntity,
                    {
                        id: user.id,
                    })
                expect(reloaded.twoFactorEnabled).toBe(false)
                expect(reloaded.twoFactorSecret).toBeNull()
            })

        it("disableTwoFactor while enabled rejects a wrong code and leaves 2FA on",
            async () => {
                const user = await seedUser("kc-2fa-disable-bad")
                await setupTwoFactorResolver.execute(user)
                const afterSetup = await entityManager.findOneByOrFail(UserEntity,
                    {
                        id: user.id,
                    })
                await confirmTwoFactorResolver.execute(
                    {
                        code: VALID_CODE,
                    },
                    afterSetup,
                )
                const enabled = await entityManager.findOneByOrFail(UserEntity,
                    {
                        id: user.id,
                    })

                await expect(
                    disableTwoFactorResolver.execute(
                        {
                            code: INVALID_CODE,
                        },
                        enabled,
                    ),
                ).rejects.toBeInstanceOf(TwoFactorInvalidCodeException)

                const reloaded = await entityManager.findOneByOrFail(UserEntity,
                    {
                        id: user.id,
                    })
                expect(reloaded.twoFactorEnabled).toBe(true)
                expect(reloaded.twoFactorSecret).not.toBeNull()
            })

        it("disableTwoFactor while already disabled is idempotent — no code required, clears any leftover pending secret",
            async () => {
                const user = await seedUser("kc-2fa-disable-idempotent")
                // enrollment started but never confirmed — a pending secret exists
                // while the flag is still false
                await setupTwoFactorResolver.execute(user)
                const pending = await entityManager.findOneByOrFail(UserEntity,
                    {
                        id: user.id,
                    })
                expect(pending.twoFactorEnabled).toBe(false)
                expect(pending.twoFactorSecret).not.toBeNull()

                // the code guard only applies while `twoFactorEnabled` is true, so an
                // obviously-wrong code still succeeds here
                await disableTwoFactorResolver.execute(
                    {
                        code: INVALID_CODE,
                    },
                    pending,
                )

                const reloaded = await entityManager.findOneByOrFail(UserEntity,
                    {
                        id: user.id,
                    })
                expect(reloaded.twoFactorEnabled).toBe(false)
                expect(reloaded.twoFactorSecret).toBeNull()
            })
    })
