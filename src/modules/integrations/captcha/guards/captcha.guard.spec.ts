import {
    CaptchaGuard
} from "./captcha.guard"
import {
    CaptchaVerificationFailedException
} from "@modules/platform/exceptions/errors/guards/captcha-verification-failed"

describe("CaptchaGuard",
    () => {
        const context = (request: Record<string, unknown>) => ({
            getType: () => "http", switchToHttp: () => ({
                getRequest: () => request
            })
        }) as never
        it("allows valid captcha and forwards token/ip",
            async () => {
                const verify = jest.fn().mockResolvedValue(true)
                await expect(new CaptchaGuard({
                    verify
                } as never).canActivate(context({
                    headers: {
                        "x-captcha-token": ["token"], "x-forwarded-for": "1.2.3.4, proxy"
                    }
                }))).resolves.toBe(true)
                expect(verify).toHaveBeenCalledWith({
                    token: "token", remoteIp: "1.2.3.4"
                })
            })
        it("rejects invalid captcha",
            async () => {
                await expect(new CaptchaGuard({
                    verify: jest.fn().mockResolvedValue(false)
                } as never).canActivate(context({
                    headers: {
                    }, ip: "5.6.7.8"
                }))).rejects.toBeInstanceOf(CaptchaVerificationFailedException)
            })
    })
