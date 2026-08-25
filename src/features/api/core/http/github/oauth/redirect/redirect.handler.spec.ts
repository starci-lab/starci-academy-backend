import {
    GithubOauthRedirectCommandHandler
} from "./redirect.handler"
import {
    GithubOauthRedirectCommand
} from "./redirect.command"
import {
    MissingRequiredParameterException
} from "@modules/platform/exceptions/errors/stdlib/missing-required-parameter"
describe("GithubOauthRedirectCommandHandler",
    () => { const make = () => { const h = {
        verifyRefreshToken: jest.fn().mockResolvedValue({
            active: true, sub: "kc1"
        }), getUserByKeycloakId: jest.fn().mockResolvedValue({
            id: "u1"
        }), issue: jest.fn().mockResolvedValue("nonce"), encrypt: jest.fn().mockReturnValue({
            iv: "i", authTag: "a", ciphertext: "c"
        }), stringify: jest.fn((v: unknown) => JSON.stringify(v))
    }; return {
        handler: new GithubOauthRedirectCommandHandler(h as never,
h as never,
{
    buildAuthorizeRedirectUrl: jest.fn().mockReturnValue("https://github")
} as never,
h as never,
h as never,
h as never), h
    } }; it("builds encrypted redirect state",
        async () => { const { handler, h } = make(); await expect(handler.execute(new GithubOauthRedirectCommand({
            refreshToken: "r", redirectUri: "https://app"
        }))).resolves.toEqual({
            url: "https://github"
        }); expect(h.issue).toHaveBeenCalled() }); it("rejects missing redirect URI before token verification",
        async () => { const { handler, h } = make(); await expect(handler.execute(new GithubOauthRedirectCommand({
            refreshToken: "r", redirectUri: ""
        }))).rejects.toThrow(MissingRequiredParameterException); expect(h.verifyRefreshToken).not.toHaveBeenCalled() }) })
