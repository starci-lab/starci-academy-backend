import type {
    Request,
    Response,
} from "express"
import {
    CookieName,
} from "@modules/platform/cookie/enums"
import {
    SignInInitResolver,
} from "./sign-in-init.resolver"
import type {
    SignInInitService,
} from "./sign-in-init.service"
import type {
    CookieService,
} from "@modules/platform/cookie/cookie.service"
import type {
    CsrfService,
} from "@modules/platform/csrf/csrf.service"
import type {
    SessionService,
} from "@modules/platform/session/session.service"

describe("SignInInitResolver",
    () => {
        let resolver: SignInInitResolver
        let signInInitService: jest.Mocked<Pick<SignInInitService, "execute">>
        let cookieService: jest.Mocked<Pick<CookieService, "attachHttpOnlyCookie">>
        let csrfService: jest.Mocked<Pick<CsrfService, "issueCookie">>
        let sessionService: jest.Mocked<Pick<SessionService, "startSession">>
        let req: Request
        let res: Response

        beforeEach(() => {
            signInInitService = {
                execute: jest.fn(),
            }
            cookieService = {
                attachHttpOnlyCookie: jest.fn(),
            }
            csrfService = {
                issueCookie: jest.fn(),
            }
            sessionService = {
                startSession: jest.fn(),
            }
            req = {
            } as Request
            res = {
            } as Response
            resolver = new SignInInitResolver(
                signInInitService as unknown as SignInInitService,
                cookieService as unknown as CookieService,
                csrfService as unknown as CsrfService,
                sessionService as unknown as SessionService,
            )
        })

        it("returns a challenge without starting an HTTP session",
            async () => {
                signInInitService.execute.mockResolvedValueOnce({
                    kind: "challenge",
                    data: {
                        challengeId: "challenge-1",
                        expiresInSeconds: 300,
                    },
                })

                const result = await resolver.execute(
                    {
                        email: "learner@example.com",
                        password: "secret",
                    },
                    {
                        req,
                        res,
                    },
                )

                expect(result).toEqual({
                    challengeId: "challenge-1",
                    expiresInSeconds: 300,
                })
                expect(cookieService.attachHttpOnlyCookie).not.toHaveBeenCalled()
                expect(csrfService.issueCookie).not.toHaveBeenCalled()
                expect(sessionService.startSession).not.toHaveBeenCalled()
            })

        it("attaches the complete session for the local direct-session result",
            async () => {
                signInInitService.execute.mockResolvedValueOnce({
                    kind: "session",
                    data: {
                        accessToken: "access-local",
                    },
                    refreshToken: "refresh-local",
                })

                const result = await resolver.execute(
                    {
                        email: "test@starci.local",
                        password: "secret",
                    },
                    {
                        req,
                        res,
                    },
                )

                expect(result).toEqual({
                    accessToken: "access-local",
                })
                expect(cookieService.attachHttpOnlyCookie).toHaveBeenCalledWith({
                    res,
                    name: CookieName.KeycloakRefreshToken,
                    value: "refresh-local",
                })
                expect(csrfService.issueCookie).toHaveBeenCalledWith({
                    res,
                })
                expect(sessionService.startSession).toHaveBeenCalledWith({
                    res,
                    req,
                    accessToken: "access-local",
                })
            })
    })
