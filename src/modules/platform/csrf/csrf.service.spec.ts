import {
    CsrfService
} from "./csrf.service"

describe("CsrfService",
    () => {
        it("issues a cookie token that verifies and rejects tampering",
            () => {
                const cookie = {
                    attachReadableCookie: jest.fn(), clearCookie: jest.fn()
                }
                const service = new CsrfService(cookie as never)
                const token = service.issueCookie({
                    res: {
                    } as never
                })
                expect(cookie.attachReadableCookie).toHaveBeenCalled()
                expect(service.verify(token)).toBe(true)
                expect(service.verify(`${token}x`)).toBe(false)
                expect(service.verify("")).toBe(false)
            })
    })
