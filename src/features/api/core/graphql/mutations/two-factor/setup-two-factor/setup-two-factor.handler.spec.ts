import "@modules/bussiness/bussiness.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    EncryptionService,
} from "@modules/crypto/encryption.service"
import {
    TotpService,
} from "@modules/integrations/totp/totp.service"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    SetupTwoFactorCommand,
} from "./setup-two-factor.command"
import {
    SetupTwoFactorHandler,
} from "./setup-two-factor.handler"

const POSTGRESQL_PRIMARY = "primary"

describe("SetupTwoFactorHandler",
    () => {
        let module: TestingModule
        let handler: SetupTwoFactorHandler
        let entityManager: EntityManagerMock

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            module = await Test.createTestingModule({
                providers: [
                    SetupTwoFactorHandler,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: TotpService,
                        useValue: {
                            generateSecret: jest.fn().mockReturnValue("TOTP-SECRET"),
                            generateKeyUri: jest.fn().mockReturnValue("otpauth://starci"),
                        },
                    },
                    {
                        provide: EncryptionService,
                        useValue: {
                            encrypt: jest.fn().mockReturnValue({
                                iv: "iv",
                                authTag: "tag",
                                ciphertext: "ciphertext",
                            }),
                        },
                    },
                ],
            }).compile()
            handler = module.get(SetupTwoFactorHandler)
        })

        afterEach(async () => module.close())

        it("stores a pending encrypted secret while keeping 2FA disabled",
            async () => {
                const user = {
                    id: "user-1",
                    email: "learner@starci.test",
                } as UserEntity

                const result = await handler.execute(
                    new SetupTwoFactorCommand({
                        request: undefined,
                        user,
                    }),
                )

                expect(entityManager.update).toHaveBeenCalledWith(
                    expect.anything(),
                    {
                        id: user.id,
                    },
                    {
                        twoFactorSecret: JSON.stringify({
                            iv: "iv",
                            authTag: "tag",
                            ciphertext: "ciphertext",
                        }),
                        twoFactorEnabled: false,
                    },
                )
                expect(result).toEqual({
                    secret: "TOTP-SECRET",
                    otpauthUrl: "otpauth://starci",
                })
            })

        it("rejects setup without an authenticated user",
            async () => {
                await expect(handler.execute(
                    new SetupTwoFactorCommand({
                        request: undefined,
                    }),
                )).rejects.toBeInstanceOf(UserNotFoundException)
            })
    })
