import {
    CsrfGuard 
} from "./csrf.guard"
import {
    CSRF_HEADER_NAME 
} from "../constants"
import {
    CookieName 
} from "@modules/platform/cookie/enums"
import type {
    ExecutionContext,
} from "@nestjs/common"
import type {
    Request,
} from "express"

type TestContext = ExecutionContext & { req?: Request }

jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: () => ({
            cors: {
                origins: ["https://app.example.com"] 
            } 
        }),
    }))
jest.mock("@nestjs/graphql",
    () => ({
        GqlExecutionContext: {
            create: (c: TestContext) => ({
                getContext: () => c 
            }) 
        },
    }))

describe("CsrfGuard",
    () => {
        const make = (req: Record<string, string | string[] | undefined> = {
        }) => {
            const csrfService = {
                verify: jest.fn().mockReturnValue(true) 
            }
            const cookieService = {
                getAllCookieValues: jest.fn().mockReturnValue(["signed-token"]),
            }
            const guard = new CsrfGuard(csrfService as never,
cookieService as never)
            return {
                guard,
                csrfService,
                cookieService,
                context: {
                    req: {
                        headers: {
                            [CSRF_HEADER_NAME]: "signed-token", ...req 
                        } 
                    },
                } as unknown as TestContext,
            }
        }

        it("accepts a matching signed token and uses the cookie service",
            async () => {
                const { guard, csrfService, cookieService, context } = make({
                    origin: "https://app.example.com",
                })
                await expect(guard.canActivate(context)).resolves.toBe(true)
                expect(cookieService.getAllCookieValues).toHaveBeenCalledWith(
                    context.req,
                    CookieName.CsrfToken,
                )
                expect(csrfService.verify).toHaveBeenCalledWith("signed-token")
            })
        it("rejects missing request, token, mismatches, invalid signatures, and untrusted origins",
            async () => {
                const missing = make()
                missing.context.req = undefined
                await expect(missing.guard.canActivate(missing.context)).rejects.toThrow()
                const noToken = make()
                noToken.context.req!.headers[CSRF_HEADER_NAME] = undefined
                noToken.cookieService.getAllCookieValues.mockReturnValue([])
                await expect(noToken.guard.canActivate(noToken.context)).rejects.toThrow()
                const mismatch = make()
                mismatch.cookieService.getAllCookieValues.mockReturnValue(["different"])
                await expect(
                    mismatch.guard.canActivate(mismatch.context),
                ).rejects.toThrow()
                const invalid = make()
                invalid.csrfService.verify.mockReturnValue(false)
                await expect(invalid.guard.canActivate(invalid.context)).rejects.toThrow()
                const origin = make({
                    origin: "https://evil.example" 
                })
                await expect(origin.guard.canActivate(origin.context)).rejects.toThrow()
            })
        it("supports array headers and referer fallback, including malformed referers",
            async () => {
                const { guard, context } = make({
                    [CSRF_HEADER_NAME]: ["signed-token",
                        "other"],
                    referer: "https://app.example.com/path",
                })
                await expect(guard.canActivate(context)).resolves.toBe(true)
                const malformed = make({
                    referer: "%%%" 
                })
                await expect(malformed.guard.canActivate(malformed.context)).resolves.toBe(
                    true,
                )
            })
    })
