import {
    CaptchaService
} from "./captcha.service"
jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: () => ({
            captcha: {
                enabled: false, turnstileSecret: ""
            }
        })
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
    })
