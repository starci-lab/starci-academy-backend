jest.mock("./utils/mount-secrets",
    () => ({
        getAppConfig: jest.fn().mockReturnValue({
        }), getS3SecretAccessKey: jest.fn().mockReturnValue("s3"), getPayosApiKey: jest.fn().mockReturnValue("payos"), getKeycloakClientSecret: jest.fn().mockReturnValue("kc"), getEncryptionKey: jest.fn().mockReturnValue("enc"), getGithubAccessToken: jest.fn().mockReturnValue("gh"), getDataGitToken: jest.fn().mockReturnValue("data"), getGithubSecretKey: jest.fn().mockReturnValue("secret"), getSepayApiKey: jest.fn().mockReturnValue("sepay"), getSepayIpnSecret: jest.fn().mockReturnValue("ipn"), getJudge0AuthToken: jest.fn().mockReturnValue("judge"), getStripeSecretKey: jest.fn().mockReturnValue("stripe"), getStripeWebhookSecret: jest.fn().mockReturnValue("hook"), getPaypalClientId: jest.fn().mockReturnValue("client"), getPaypalClientSecret: jest.fn().mockReturnValue("paypal"), getPaypalWebhookId: jest.fn().mockReturnValue("webhook"), getNowpaymentsApiKey: jest.fn().mockReturnValue("now"), getNowpaymentsIpnSecret: jest.fn().mockReturnValue("now-ipn"), getBrevoSmtpPassword: jest.fn().mockReturnValue("brevo"), getAdminApiKey: jest.fn().mockReturnValue("admin"), getKeycloakAdmin: jest.fn().mockReturnValue({
        }), getOpenAiApiKeys: jest.fn().mockReturnValue(["openai"]), getGeminiApiKeys: jest.fn().mockReturnValue(["gemini"]), getLocalApiKeys: jest.fn().mockReturnValue(["local"]), getOpenRouterApiKeys: jest.fn().mockReturnValue(["router"]), getAnthropicApiKeys: jest.fn().mockReturnValue(["anthropic"]), readAiKeysFile: jest.fn().mockReturnValue(["key"])
    }))
jest.mock("./utils/mount-seed",
    () => ({
        getSeedConfig: jest.fn().mockReturnValue({
        })
    }))
import {
    MountFilesystemService
} from "./mount.service"

describe("MountFilesystemService",
    () => {
        it("delegates mounted secret/config accessors",
            () => {
                const service = new MountFilesystemService(); expect(service.s3SecretAccessKey()).toBe("s3"); expect(service.seedConfig()).toEqual({
                }); expect(service.openAiApiKeys()).toEqual(["openai"]); expect(service.readKeysFile("keys")).toEqual(["key"])
            })
    })
it("exposes every provider key pool and secret accessor",
    () => {
        const service = new MountFilesystemService()
        expect(service.s3SecretAccessKey()).toBe("s3")
        expect(service.keycloakClientSecret()).toBe("kc")
        expect(service.encryptionKey()).toBe("enc")
        expect(service.payosApiKey()).toBe("payos")
        expect(service.githubAccessToken()).toBe("gh")
        expect(service.dataGitToken()).toBe("data")
        expect(service.githubSecretKey()).toBe("secret")
        expect(service.sepayApiKey()).toBe("sepay")
        expect(service.sepayIpnSecret()).toBe("ipn")
        expect(service.judge0AuthToken()).toBe("judge")
        expect(service.stripeSecretKey()).toBe("stripe")
        expect(service.stripeWebhookSecret()).toBe("hook")
        expect(service.paypalClientId()).toBe("client")
        expect(service.paypalClientSecret()).toBe("paypal")
        expect(service.paypalWebhookId()).toBe("webhook")
        expect(service.nowpaymentsApiKey()).toBe("now")
        expect(service.nowpaymentsIpnSecret()).toBe("now-ipn")
        expect(service.brevoSmtpPassword()).toBe("brevo")
        expect(service.adminApiKey()).toBe("admin")
        expect(service.keycloakAdmin()).toEqual({
        })
        expect(service.geminiApiKeys()).toEqual(["gemini"])
        expect(service.localApiKeys()).toEqual(["local"])
        expect(service.openRouterApiKeys()).toEqual(["router"])
        expect(service.anthropicApiKeys()).toEqual(["anthropic"])
    })
