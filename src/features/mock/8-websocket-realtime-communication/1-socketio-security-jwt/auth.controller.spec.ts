import {
    AuthController
} from "./auth.controller"
import {
    MockInvalidCredentialsException
} from "@modules/platform/exceptions/errors/mock/auth"

describe("AuthController",
    () => {
        it("registers and signs the returned user claims",
            () => {
                const sign = jest.fn().mockReturnValue("token")
                const controller = new AuthController({
                    sign
                } as never,
{
    register: jest.fn().mockReturnValue({
        sub: 4, username: "alice"
    }),
} as never)

                expect(controller.register({
                    username: "alice", password: "secret"
                })).toEqual({
                    access_token: "token",
                })
                expect(sign).toHaveBeenCalledWith({
                    sub: 4, username: "alice"
                })
            })

        it("rejects invalid credentials and signs valid logins",
            () => {
                const sign = jest.fn().mockReturnValue("login-token")
                const verify = jest.fn()
                    .mockReturnValueOnce(null)
                    .mockReturnValueOnce({
                        sub: 9, username: "bob"
                    })
                const controller = new AuthController({
                    sign
                } as never,
{
    verify
} as never)

                expect(() => controller.login({
                    username: "bad", password: "bad"
                }))
                    .toThrow(MockInvalidCredentialsException)
                expect(controller.login({
                    username: "bob", password: "secret"
                })).toEqual({
                    access_token: "login-token",
                })
            })
    })
