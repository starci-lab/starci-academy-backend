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
