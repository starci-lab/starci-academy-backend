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
    TwoFactorInvalidCodeException,
} from "@modules/platform/exceptions/errors/api/two-factor-invalid-code"
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
    DisableTwoFactorCommand,
} from "./disable-two-factor.command"
import {
    DisableTwoFactorHandler,
} from "./disable-two-factor.handler"

const POSTGRESQL_PRIMARY = "primary"

describe("DisableTwoFactorHandler",
    () => {
        let module: TestingModule
        let handler: DisableTwoFactorHandler
        let entityManager: EntityManagerMock
        let verify: jest.Mock

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            entityManager.findOne.mockResolvedValue({
                id: "user-1",
                twoFactorEnabled: true,
                twoFactorSecret: JSON.stringify({
                    ciphertext: "encrypted",
                }),
            })
            verify = jest.fn().mockReturnValue(true)
            module = await Test.createTestingModule({
                providers: [
                    DisableTwoFactorHandler,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: EncryptionService,
                        useValue: {
                            decrypt: jest.fn().mockReturnValue("TOTP-SECRET"),
                        },
                    },
                    {
                        provide: TotpService,
                        useValue: {
                            verify,
                        },
                    },
                ],
            }).compile()
            handler = module.get(DisableTwoFactorHandler)
        })

        afterEach(async () => module.close())

        it("clears the enabled factor after valid authenticator proof",
            async () => {
                await handler.execute(
                    new DisableTwoFactorCommand({
                        request: {
                            code: "111111",
                        },
                        user: {
                            id: "user-1",
                        } as UserEntity,
                    }),
                )

                expect(entityManager.update).toHaveBeenCalledWith(
                    expect.anything(),
                    {
                        id: "user-1",
                    },
                    {
                        twoFactorEnabled: false,
                        twoFactorSecret: null,
                    },
                )
            })

        it("does not clear an enabled factor after invalid proof",
            async () => {
                verify.mockReturnValueOnce(false)

                await expect(handler.execute(
                    new DisableTwoFactorCommand({
                        request: {
                            code: "222222",
                        },
                        user: {
                            id: "user-1",
                        } as UserEntity,
                    }),
                )).rejects.toBeInstanceOf(TwoFactorInvalidCodeException)
                expect(entityManager.update).not.toHaveBeenCalled()
            })
    })
