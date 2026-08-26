jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: jest.fn().mockReturnValue({
            github: {
                oauth: {
                    clientId: "client", redirectUri: "https://app/callback"
                }
            }
        }),
    }))
jest.mock("octokit",
    () => ({
        Octokit: jest.fn().mockImplementation(() => ({
            request: jest.fn()
        })),
    }))

import {
    Octokit
} from "octokit"
import {
    GithubApiAuthService
} from "./auth.service"
import {
    GithubProfileMissingLoginException
} from "@modules/platform/exceptions/errors/github/github-profile-missing-login"
import {
    GithubTokenExchangeFailedException
} from "@modules/platform/exceptions/errors/github/github-token-exchange-failed"

describe("GithubApiAuthService",
    () => {
        it("exchanges a code and rejects a response without a token",
            async () => {
                const service = new GithubApiAuthService({
                    githubSecretKey: " secret "
                } as never)
        ;(Octokit as unknown as jest.Mock).mockImplementationOnce(() => ({
                    request: jest.fn().mockResolvedValue({
                        data: {
                            access_token: "token"
                        }
                    })
                }))
                await expect(service.exchangeOAuthCodeForAccessToken({
                    code: "code"
                })).resolves.toEqual({
                    accessToken: "token"
                })
                ;(Octokit as unknown as jest.Mock).mockImplementationOnce(() => ({
                    request: jest.fn().mockResolvedValue({
                        data: {
                        }
                    })
                }))
                await expect(service.exchangeOAuthCodeForAccessToken({
                    code: "bad"
                })).rejects.toBeInstanceOf(GithubTokenExchangeFailedException)
            })

        it("returns the authenticated login and rejects missing profiles",
            async () => {
                const service = new GithubApiAuthService({
                    githubSecretKey: "secret"
                } as never)
        ;(Octokit as unknown as jest.Mock).mockImplementationOnce(() => ({
                    request: jest.fn().mockResolvedValue({
                        data: {
                            login: "alice"
                        }
                    })
                }))
                await expect(service.getAuthenticatedUser({
                    accessToken: "token"
                })).resolves.toEqual({
                    user: {
                        login: "alice"
                    }
                })
                ;(Octokit as unknown as jest.Mock).mockImplementationOnce(() => ({
                    request: jest.fn().mockResolvedValue({
                        data: {
                        }
                    })
                }))
                await expect(service.getAuthenticatedUser({
                    accessToken: "token"
                })).rejects.toBeInstanceOf(GithubProfileMissingLoginException)
            })
    })
