import {
    CookieService
} from "./cookie.service"
import {
    CookieName
} from "./enums"

jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: () => ({
            isProduction: true, cookie: {
                domain: ".example.test"
            }
        })
    }))
describe("CookieService",
    () => {
        it("attaches refresh cookies with a session hint and clears both",
            () => {
                const res = {
                    cookie: jest.fn(), clearCookie: jest.fn()
                }; const service = new CookieService()
                service.attachHttpOnlyCookie({
                    res: res as never, name: CookieName.KeycloakRefreshToken, value: "token"
                })
                expect(res.cookie).toHaveBeenCalledTimes(2); expect(res.cookie).toHaveBeenLastCalledWith(CookieName.SessionHint,
                    "1",
                    expect.objectContaining({
                        sameSite: "lax"
                    }))
                service.clearCookie({
                    res: res as never, name: CookieName.KeycloakRefreshToken
                }); expect(res.clearCookie).toHaveBeenCalledTimes(2)
            })
        it("reads parsed and raw duplicate cookie values safely",
            () => {
                const service = new CookieService(); expect(service.getCookie({
                    cookies: {
                        x: "y"
                    }
                } as never,
                "x")).toBe("y")
                const req = {
                    headers: {
                        cookie: "csrf_token=a%20b; csrf_token=c"
                    }
                }; expect(service.getAllCookieValues(req,
                    "csrf_token")).toEqual(["a b",
                    "c"]); expect(service.getCookie(req,
                    "csrf_token")).toBe("a b")
                expect(service.getCookie(undefined,
                    "x")).toBeUndefined()
            })

        it("does not add a session hint for ordinary cookies and supports overrides",
            () => {
                const res = {
                    cookie: jest.fn(),
                }
                const service = new CookieService()

                service.attachHttpOnlyCookie({
                    res: res as never,
                    name: CookieName.SessionHint,
                    value: "1",
                    options: {
                        sameSite: "lax",
                    },
                })

                expect(res.cookie).toHaveBeenCalledTimes(1)
                expect(res.cookie).toHaveBeenCalledWith(CookieName.SessionHint,
                    "1",
                    expect.objectContaining({
                        httpOnly: true,
                        sameSite: "lax",
                        secure: true,
                    }))
            })
    })
