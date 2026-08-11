// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs`.
import "@modules/bussiness/bussiness.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    KeycloakTokenService,
} from "@modules/integrations/keycloak/token.service"
import {
    SignOutCommand,
} from "./sign-out.command"
import {
    SignOutHandler,
} from "./sign-out.handler"

describe("SignOutHandler",
    () => {
        let module: TestingModule
        let handler: SignOutHandler
        let keycloakTokenService: jest.Mocked<Pick<KeycloakTokenService, "revokeRefreshToken">>

        beforeEach(async () => {
            keycloakTokenService = {
                revokeRefreshToken: jest.fn().mockResolvedValue(undefined),
            }

            module = await Test.createTestingModule({
                providers: [
                    SignOutHandler,
                    {
                        provide: KeycloakTokenService,
                        useValue: keycloakTokenService,
                    },
                ],
            }).compile()

            handler = module.get(SignOutHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("revokes the device refresh token at the identity provider",
            async () => {
                const result = await handler.execute(
                    new SignOutCommand({
                        request: {
                            refreshToken: "refresh-current-device",
                        },
                    }),
                )

                expect(keycloakTokenService.revokeRefreshToken).toHaveBeenCalledWith({
                    refreshToken: "refresh-current-device",
                })
                expect(result).toBeUndefined()
            })

        it("propagates revocation failure so the resolver cannot report a false sign-out",
            async () => {
                keycloakTokenService.revokeRefreshToken.mockRejectedValueOnce(
                    new Error("identity provider unavailable"),
                )

                await expect(handler.execute(
                    new SignOutCommand({
                        request: {
                            refreshToken: "refresh-current-device",
                        },
                    }),
                )).rejects.toThrow("identity provider unavailable")
            })
    })
