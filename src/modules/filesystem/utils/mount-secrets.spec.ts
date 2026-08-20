jest.mock("node:fs",
    () => ({
        existsSync: jest.fn(),
        readFileSync: jest.fn(),
    }))
jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: jest.fn(),
    }))

import {
    existsSync,
    readFileSync,
} from "node:fs"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    clearRuntimeAppConfig,
    getAdminApiKey,
    getAnthropicApiKeys,
    getAppConfig,
    getBrevoSmtpPassword,
    getDataGitToken,
    getEncryptionKey,
    getGithubAccessToken,
    getGithubSecretKey,
    getGcpServiceAccountCredentials,
    getGeminiApiKeys,
    getJudge0AuthToken,
    getKeycloakAdmin,
    getKeycloakClientSecret,
    getLocalApiKeys,
    getNowpaymentsApiKey,
    getNowpaymentsIpnSecret,
    getOpenAiApiKeys,
    getOpenRouterApiKeys,
    getPaypalClientId,
    getPaypalClientSecret,
    getPaypalWebhookId,
    getPayosApiKey,
    getS3SecretAccessKey,
    getSepayApiKey,
    getSepayIpnSecret,
    getStripeSecretKey,
    getStripeWebhookSecret,
    parseApiKeys,
    parseApiKeysFile,
    readAiKeysFile,
    setRuntimeAppConfig,
} from "./mount-secrets"

const appConfig = {
    mountPath: {
        config: {
            app: "app.yaml" 
        },
        aiKeys: {
            dir: "keys" 
        },
        files: {
            sepayIpnSecret: "sepay.secret" 
        },
    },
    secrets: {
        s3SecretAccessKey: "s3",
        payosApiKey: "payos",
        aiKeys: {
            openai: "oa-1\n# comment\n oa-2",
            gemini: "gemini",
            local: "",
            openrouter: "router",
            anthropic: "anthropic",
        },
        keycloakClientSecret: "kc-client",
        encryptionKey: "encrypt",
        githubAccessToken: "github",
        dataGitToken: "",
        githubSecretKey: "github-secret",
        sepayApiKey: "sepay",
        judge0AuthToken: " judge ",
        stripeSecretKey: "stripe",
        stripeWebhookSecret: "stripe-hook",
        paypalClientId: "paypal-id",
        paypalClientSecret: "paypal-secret",
        paypalWebhookId: "paypal-hook",
        nowpaymentsApiKey: "now",
        nowpaymentsIpnSecret: "now-hook",
        brevoSmtpPassword: "brevo",
        adminApiKey: "admin",
        gcpServiceAccountJson: "",
        keycloakAdmin: JSON.stringify({
            username: "admin",
            password: "password",
        }),
    },
}

describe("mount-secrets utilities",
    () => {
        beforeEach(() => {
            jest.clearAllMocks()
            jest.mocked(envConfig).mockReturnValue(appConfig as never)
            jest.mocked(existsSync).mockReturnValue(false)
            jest.mocked(readFileSync).mockReturnValue("" as never)
            clearRuntimeAppConfig()
        })

        it("parses key pools, app overrides, and all direct secret getters",
            () => {
                expect(parseApiKeys(" a\n# ignored\n\n b ")).toEqual(["a",
                    "b"])
                expect(getS3SecretAccessKey()).toBe("s3")
                expect(getPayosApiKey()).toBe("payos")
                expect(getOpenAiApiKeys()).toEqual(["oa-1",
                    "oa-2"])
                expect(getGeminiApiKeys()).toEqual(["gemini"])
                expect(getLocalApiKeys()).toEqual(["ollama"])
                expect(getOpenRouterApiKeys()).toEqual(["router"])
                expect(getAnthropicApiKeys()).toEqual(["anthropic"])
                expect(getKeycloakClientSecret()).toBe("kc-client")
                expect(getEncryptionKey()).toBe("encrypt")
                expect(getGithubAccessToken()).toBe("github")
                expect(getGithubSecretKey()).toBe("github-secret")
                expect(getSepayApiKey()).toBe("sepay")
                expect(getJudge0AuthToken()).toBe("judge")
                expect(getStripeSecretKey()).toBe("stripe")
                expect(getStripeWebhookSecret()).toBe("stripe-hook")
                expect(getPaypalClientId()).toBe("paypal-id")
                expect(getPaypalClientSecret()).toBe("paypal-secret")
                expect(getPaypalWebhookId()).toBe("paypal-hook")
                expect(getNowpaymentsApiKey()).toBe("now")
                expect(getNowpaymentsIpnSecret()).toBe("now-hook")
                expect(getBrevoSmtpPassword()).toBe("brevo")
                expect(getAdminApiKey()).toBe("admin")
                expect(getKeycloakAdmin()).toEqual({
                    username: "admin",
                    password: "password",
                })

                const override = {
                    catalog: "runtime" 
                }
                setRuntimeAppConfig(override as never)
                expect(getAppConfig()).toBe(override)
                expect(getAppConfig({
                    catalog: "explicit" 
                } as never)).toEqual({
                    catalog: "explicit" 
                })
            })

        it("loads app.yaml from disk only after runtime overrides are cleared",
            () => {
                jest.mocked(readFileSync).mockReturnValue("catalog: disk" as never)

                expect(getAppConfig()).toEqual({
                    catalog: "disk" 
                })
                expect(readFileSync).toHaveBeenCalledWith("app.yaml",
                    "utf8")
            })

        it("handles AI key files, data-git fallback, GCP credentials, and IPN secret fallbacks",
            () => {
                jest.mocked(existsSync).mockImplementation((path) => String(path).endsWith("keys.txt")
            || String(path) === "sepay.secret")
                jest.mocked(readFileSync).mockImplementation((path) => {
                    if (String(path) === "sepay.secret") {
                        return "  ipn-secret  " as never
                    }
                    if (String(path).endsWith("keys.txt")) {
                        return " key-a\n# key comment\nkey-b" as never
                    }
                    return "" as never
                })

                expect(parseApiKeysFile("missing.txt")).toEqual([])
                expect(parseApiKeysFile("keys.txt")).toEqual(["key-a",
                    "key-b"])
                expect(readAiKeysFile("keys.txt")).toEqual(["key-a",
                    "key-b"])
                expect(readAiKeysFile("nested/keys.txt")).toEqual(["key-a",
                    "key-b"])
                expect(getDataGitToken()).toBe("github")
                expect(getSepayIpnSecret()).toBe("ipn-secret")

                jest.mocked(existsSync).mockReturnValue(false)
                expect(getSepayIpnSecret()).toBe("")
                expect(getGcpServiceAccountCredentials()).toBeUndefined()

                jest.mocked(envConfig).mockReturnValue({
                    ...appConfig,
                    secrets: {
                        ...appConfig.secrets,
                        dataGitToken: " dedicated ",
                        gcpServiceAccountJson: JSON.stringify({
                            project_id: "project" 
                        }),
                    },
                } as never)
                expect(getDataGitToken()).toBe("dedicated")
                expect(getGcpServiceAccountCredentials()).toEqual({
                    project_id: "project" 
                })
            })

        it("returns safe empty values for unreadable key, secret, and malformed credential files",
            () => {
                jest.mocked(existsSync).mockReturnValue(true)
                jest.mocked(readFileSync).mockImplementation(() => {
                    throw new Error("permission denied")
                })
                expect(parseApiKeysFile("keys.txt")).toEqual([])
                expect(readAiKeysFile("keys.txt")).toEqual([])
                expect(getSepayIpnSecret()).toBe("")

                jest.mocked(envConfig).mockReturnValue({
                    ...appConfig,
                    secrets: {
                        ...appConfig.secrets,
                        gcpServiceAccountJson: "not-json",
                    },
                } as never)
                expect(getGcpServiceAccountCredentials()).toBeUndefined()
            })
    })
