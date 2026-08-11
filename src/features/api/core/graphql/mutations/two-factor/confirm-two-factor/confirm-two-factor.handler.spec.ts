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
    ConfirmTwoFactorCommand,
} from "./confirm-two-factor.command"
import {
    ConfirmTwoFactorHandler,
} from "./confirm-two-factor.handler"

const POSTGRESQL_PRIMARY = "primary"

describe("ConfirmTwoFactorHandler",
    () => {
        let module: TestingModule
        let handler: ConfirmTwoFactorHandler
        let entityManager: EntityManagerMock
        let verify: jest.Mock

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            entityManager.findOne.mockResolvedValue({
                id: "user-1",
                twoFactorSecret: JSON.stringify({
                    ciphertext: "encrypted",
                }),
            })
            verify = jest.fn().mockReturnValue(true)
            module = await Test.createTestingModule({
                providers: [
                    ConfirmTwoFactorHandler,
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
            handler = module.get(ConfirmTwoFactorHandler)
        })

        afterEach(async () => module.close())

        it("enables 2FA only after the pending secret accepts the code",
            async () => {
                await handler.execute(
                    new ConfirmTwoFactorCommand({
                        request: {
                            code: "111111",
                        },
                        user: {
                            id: "user-1",
                        } as UserEntity,
                    }),
                )

                expect(verify).toHaveBeenCalledWith({
                    secret: "TOTP-SECRET",
                    token: "111111",
                })
                expect(entityManager.update).toHaveBeenCalledWith(
                    expect.anything(),
                    {
                        id: "user-1",
                    },
                    {
                        twoFactorEnabled: true,
                    },
                )
            })

        it("keeps 2FA disabled when the code is invalid",
            async () => {
                verify.mockReturnValueOnce(false)

                await expect(handler.execute(
                    new ConfirmTwoFactorCommand({
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
