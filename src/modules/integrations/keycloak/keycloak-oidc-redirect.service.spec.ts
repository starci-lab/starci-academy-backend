import {
    KeycloakIdentityProvider,
} from "./types/tokens"
import {
    KeycloakOidcRedirectService,
} from "./keycloak-oidc-redirect.service"

jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: () => ({
            keycloak: {
                url: "https://sso.example.test/",
                realm: "academy",
                clientId: "web-client",
            },
        }),
    }))

describe("KeycloakOidcRedirectService",
    () => {
        it("encodes PKCE values as URL-safe strings",
            () => {
                const service = new KeycloakOidcRedirectService({
                } as never)

                expect(service.toBase64Url(Buffer.from([255,
                    255,
                    255]))).toBe("____")
                expect(service.generateCodeVerifier()).toMatch(/^[A-Za-z0-9_-]{43}$/u)
                expect(service.createCodeChallengeS256("verifier")).toMatch(/^[A-Za-z0-9_-]+$/u)
            })

        it("issues state and returns a complete broker authorization URL",
            async () => {
                const issue = jest.fn().mockResolvedValue("state-123")
                const service = new KeycloakOidcRedirectService({
                    issue
                } as never)

                const result = await service.buildAuthorizeRedirectUrl(
                    KeycloakIdentityProvider.Google,
                    "https://app.example.test/callback",
                )

                const url = new URL(result)
                expect(url.origin).toBe("https://sso.example.test")
                expect(url.pathname).toBe("/realms/academy/protocol/openid-connect/auth")
                expect(url.searchParams.get("client_id")).toBe("web-client")
                expect(url.searchParams.get("redirect_uri")).toBe("https://app.example.test/callback")
                expect(url.searchParams.get("kc_idp_hint")).toBe("google")
                expect(url.searchParams.get("code_challenge_method")).toBe("S256")
                expect(issue).toHaveBeenCalledWith(expect.objectContaining({
                    payload: expect.objectContaining({
                        provider: KeycloakIdentityProvider.Google,
                        redirectUri: "https://app.example.test/callback",
                        codeVerifier: expect.any(String),
                    }),
                }))
            })

        it("returns a matching PKCE bundle and rejects a mismatched provider",
            async () => {
                const consume = jest.fn().mockResolvedValue({
                    provider: KeycloakIdentityProvider.Github,
                    codeVerifier: "verifier",
                    redirectUri: "https://app.example.test/callback",
                })
                const service = new KeycloakOidcRedirectService({
                    consume
                } as never)

                await expect(service.consumePkceBundle(
                    KeycloakIdentityProvider.Github,
                    "state-123",
                )).resolves.toEqual({
                    codeVerifier: "verifier",
                    redirectUri: "https://app.example.test/callback",
                })
                await expect(service.consumePkceBundle(
                    KeycloakIdentityProvider.Google,
                    "state-123",
                )).rejects.toThrow()
                expect(consume).toHaveBeenCalledTimes(2)
            })
    })
