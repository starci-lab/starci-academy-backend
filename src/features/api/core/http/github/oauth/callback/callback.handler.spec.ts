import SuperJSON from "superjson"
jest.mock("@modules/integrations/github/auth.service",
    () => ({
        GithubApiAuthService: class {},
    }))
import {
    GithubOauthCallbackHandler 
} from "./callback.handler"
import {
    GithubOauthCallbackCommand 
} from "./callback.command"
import {
    OAuthStatePurpose 
} from "@modules/platform/oauth-state/types"

describe("GithubOauthCallbackHandler",
    () => {
        const encryptionService = {
            decrypt: jest.fn() 
        }
        const superJson = {
            parse: jest.fn() 
        }
        const githubApiAuthService = {
            exchangeOAuthCodeForAccessToken: jest.fn(),
            getAuthenticatedUser: jest.fn(),
        }
        const entityManager = {
            findOne: jest.fn(), save: jest.fn() 
        }
        const oauthStateService = {
            consume: jest.fn() 
        }
        let handler: GithubOauthCallbackHandler

        beforeEach(() => {
            jest.clearAllMocks()
            handler = new GithubOauthCallbackHandler(
      encryptionService as never,
      superJson as unknown as SuperJSON,
      githubApiAuthService as never,
      entityManager as never,
      oauthStateService as never,
            )
        })

        it("claims state, links the GitHub login, and returns the bound redirect",
            async () => {
                superJson.parse
                    .mockReturnValueOnce({
                        iv: "iv", authTag: "tag", ciphertext: "cipher" 
                    })
                    .mockReturnValueOnce({
                        nonce: "nonce" 
                    })
                encryptionService.decrypt.mockReturnValue("decrypted")
                oauthStateService.consume.mockResolvedValue({
                    redirectUri: "/courses",
                    userId: "u1",
                })
                githubApiAuthService.exchangeOAuthCodeForAccessToken.mockResolvedValue({
                    accessToken: "token",
                })
                githubApiAuthService.getAuthenticatedUser.mockResolvedValue({
                    user: {
                        login: "octocat" 
                    },
                })
                const user = {
                    id: "u1", githubUsername: null 
                }
                entityManager.findOne.mockResolvedValue(user)

                await expect(
                    handler.execute(
                        new GithubOauthCallbackCommand({
                            code: "code", state: "state" 
                        }),
                    ),
                ).resolves.toEqual({
                    redirectUri: "/courses" 
                })
                expect(oauthStateService.consume).toHaveBeenCalledWith({
                    purpose: OAuthStatePurpose.GithubAccountLink,
                    state: "nonce",
                })
                expect(
                    githubApiAuthService.exchangeOAuthCodeForAccessToken,
                ).toHaveBeenCalledWith({
                    code: "code" 
                })
                expect(user.githubUsername).toBe("octocat")
                expect(entityManager.save).toHaveBeenCalledWith(user)
            })

        it.each([
            ["",
                "state"],
            ["code",
                ""],
        ])("rejects missing required parameters (%s, %s)",
            async (code, state) => {
                await expect(
                    handler.execute(new GithubOauthCallbackCommand({
                        code, state 
                    })),
                ).rejects.toMatchObject({
                    code: "MISSING_REQUIRED_PARAMETER_EXCEPTION" 
                })
                expect(encryptionService.decrypt).not.toHaveBeenCalled()
            })

        it("rejects malformed, replayed, and unknown-user callbacks before saving",
            async () => {
                superJson.parse.mockReturnValueOnce({
                    iv: "iv" 
                })
                await expect(
                    handler.execute(
                        new GithubOauthCallbackCommand({
                            code: "c", state: "s" 
                        }),
                    ),
                ).rejects.toMatchObject({
                    code: "INVALID_OAUTH_STATE_PAYLOAD_EXCEPTION" 
                })

                superJson.parse
                    .mockReturnValueOnce({
                        iv: "iv", authTag: "tag", ciphertext: "cipher" 
                    })
                    .mockReturnValueOnce({
                        nonce: "n" 
                    })
                encryptionService.decrypt.mockReturnValue("d")
                oauthStateService.consume.mockResolvedValue(null)
                await expect(
                    handler.execute(
                        new GithubOauthCallbackCommand({
                            code: "c", state: "s" 
                        }),
                    ),
                ).rejects.toMatchObject({
                    code: "INVALID_OAUTH_STATE_PAYLOAD_EXCEPTION" 
                })
                expect(
                    githubApiAuthService.exchangeOAuthCodeForAccessToken,
                ).not.toHaveBeenCalled()
            })

        it("rejects missing nonce and missing user",
            async () => {
                superJson.parse
                    .mockReturnValueOnce({
                        iv: "i", authTag: "a", ciphertext: "c" 
                    })
                    .mockReturnValueOnce({
                    })
                encryptionService.decrypt.mockReturnValue("d")
                await expect(
                    handler.execute(
                        new GithubOauthCallbackCommand({
                            code: "c", state: "s" 
                        }),
                    ),
                ).rejects.toMatchObject({
                    code: "OAUTH_STATE_FIELD_MISSING_EXCEPTION" 
                })

                superJson.parse
                    .mockReturnValueOnce({
                        iv: "i", authTag: "a", ciphertext: "c" 
                    })
                    .mockReturnValueOnce({
                        nonce: "n" 
                    })
                oauthStateService.consume.mockResolvedValue({
                    redirectUri: "/",
                    userId: "missing",
                })
                githubApiAuthService.exchangeOAuthCodeForAccessToken.mockResolvedValue({
                    accessToken: "t",
                })
                githubApiAuthService.getAuthenticatedUser.mockResolvedValue({
                    user: {
                        login: "x" 
                    },
                })
                entityManager.findOne.mockResolvedValue(null)
                await expect(
                    handler.execute(
                        new GithubOauthCallbackCommand({
                            code: "c", state: "s" 
                        }),
                    ),
                ).rejects.toMatchObject({
                    code: "USER_NOT_FOUND_EXCEPTION" 
                })
            })
    })
