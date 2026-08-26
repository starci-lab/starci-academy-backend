jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: () => ({
            keycloak: {
                url: "https://keycloak.test", realm: "realm"
            }
        })
    }))
jest.mock("jwks-rsa",
    () => jest.fn(() => ({
        getSigningKey: jest.fn()
    })))
jest.mock("jsonwebtoken",
    () => ({
        verify: jest.fn((_token: string, _key: unknown, _opts: unknown, cb: (error: Error | null, payload?: object) => void) => cb(null,
            {
                preferred_username: "user"
            }))
    }))
import {
    KeycloakJwksService
} from "./jwks.service"
import {
    verify,
} from "jsonwebtoken"

describe("KeycloakJwksService",
    () => {
        it("returns inactive when a valid payload has no subject",
            async () => { await expect(new KeycloakJwksService().verifyAccessToken("token")).resolves.toEqual({
                active: false
            }) })

        it("maps a verified subject and claims to an active introspection result",
            async () => {
                jest.mocked(verify).mockImplementationOnce((_token, _key, _options, callback) => {
                    callback?.(null,
                        {
                            sub: "user-1",
                            preferred_username: "ada",
                            email: "ada@example.test",
                        })
                    return undefined
                })

                await expect(new KeycloakJwksService().verifyAccessToken("token")).resolves.toEqual(expect.objectContaining({
                    active: true,
                    sub: "user-1",
                    username: "ada",
                    preferred_username: "ada",
                    email: "ada@example.test",
                }))
            })

        it("degrades verification failures to an inactive result",
            async () => {
                jest.mocked(verify).mockImplementationOnce((_token, _key, _options, callback) => {
                    callback?.(new Error("invalid signature") as never)
                    return undefined
                })

                await expect(new KeycloakJwksService().verifyAccessToken("token")).resolves.toEqual({
                    active: false,
                })
            })

        it("handles missing, failed, absent, and valid JWKS signing keys",
            () => {
                const service = new KeycloakJwksService()
                const privateService = service as unknown as {
                    jwksClient: {
                        getSigningKey: jest.Mock,
                    }
                    getSigningKey: (
                        header: { kid?: string; alg?: string; typ?: string },
                        callback: (error: Error | null, key?: string) => void,
                    ) => void
                }
                const missingKid = jest.fn()
                privateService.getSigningKey({
                    alg: "RS256",
                    typ: "JWT",
                },
                missingKid)
                expect(missingKid).toHaveBeenCalledWith(expect.any(Error))

                const upstreamError = new Error("jwks offline")
                privateService.jwksClient.getSigningKey.mockImplementationOnce(
                    (_kid: string, callback: (error: Error | null, key?: object) => void) => callback(upstreamError),
                )
                const failed = jest.fn()
                privateService.getSigningKey({
                    kid: "kid-1"
                },
                failed)
                expect(failed).toHaveBeenCalledWith(upstreamError)

                privateService.jwksClient.getSigningKey.mockImplementationOnce(
                    (_kid: string, callback: (error: Error | null, key?: object) => void) => callback(null),
                )
                const absent = jest.fn()
                privateService.getSigningKey({
                    kid: "kid-2"
                },
                absent)
                expect(absent).toHaveBeenCalledWith(expect.any(Error))

                privateService.jwksClient.getSigningKey.mockImplementationOnce(
                    (_kid: string, callback: (error: Error | null, key?: { getPublicKey: () => string }) => void) => callback(null,
                        {
                            getPublicKey: () => "public-key",
                        }),
                )
                const valid = jest.fn()
                privateService.getSigningKey({
                    kid: "kid-3"
                },
                valid)
                expect(valid).toHaveBeenCalledWith(null,
                    "public-key")
            })
    })
