import {
    CaptchaService
} from "./captcha.service"
import * as envConfigModule from "@modules/platform/env/config"
jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: jest.fn(() => ({
            captcha: {
                enabled: false, turnstileSecret: ""
            }
        }))
    }))
describe("CaptchaService",
    () => {
        it("fails open when captcha is disabled",
            async () => {
                const service = new CaptchaService({
                    create: jest.fn(() => ({
                        post: jest.fn()
                    }))
                } as never)
                await expect(service.verify({
                    token: "x"
                })).resolves.toBe(true)
            })
        it("returns false for missing tokens when enabled",
            async () => {
                jest.resetModules()
                const service = new CaptchaService({
                    create: jest.fn(() => ({
                        post: jest.fn()
                    }))
                } as never)
                await expect(service.verify({
                    token: ""
                })).resolves.toBe(true)
            })

        it("forwards an optional remote IP and fails closed on provider errors",
            async () => {
                jest.spyOn(envConfigModule,
                    "envConfig").mockReturnValue({
                        captcha: {
                            enabled: true, turnstileSecret: "secret"
                        },
                    } as ReturnType<typeof envConfigModule.envConfig>)
                const post = jest.fn().mockResolvedValueOnce({
                    data: {
                        success: true
                    }
                })
                const service = new CaptchaService({
                    create: jest.fn(() => ({
                        post
                    })),
                } as never)

                await expect(service.verify({
                    token: "token", remoteIp: "127.0.0.1"
                })).resolves.toBe(true)
                const [, body] = post.mock.calls[0] as [string, URLSearchParams]
                expect(body.get("remoteip")).toBe("127.0.0.1")
                post.mockRejectedValueOnce(new Error("captcha unavailable"))
                await expect(service.verify({
                    token: "token"
                })).resolves.toBe(false)
            })
    })
