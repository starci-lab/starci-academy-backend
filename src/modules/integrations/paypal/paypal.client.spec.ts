import {
    PaypalClient 
} from "./paypal.client"
import {
    envConfig 
} from "@modules/platform/env/config"
jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: jest.fn() 
    }))
jest.mock("@modules/filesystem/utils/mount-secrets",
    () => ({
        getPaypalClientId: () => "client", getPaypalClientSecret: () => "secret", getPaypalWebhookId: () => "hook" 
    }))
describe("PaypalClient",
    () => {
        const setup = () => { jest.mocked(envConfig).mockReturnValue({
            services: {
                api: {
                    paypal: {
                        currency: "USD", baseUrl: "https://paypal.test" 
                    } 
                } 
            } 
        } as ReturnType<typeof envConfig>); const post = jest.fn(); const get = jest.fn(); const create = jest.fn().mockReturnValue({
            post, get 
        }); const client = new PaypalClient({
            create 
        } as never); return {
            client, post, get, create 
        } }
        it("creates an order using OAuth and returns approval link",
            async () => { const h = setup(); h.post.mockResolvedValueOnce({
                data: {
                    access_token: "token" 
                } 
            }).mockResolvedValueOnce({
                data: {
                    id: "o1", links: [{
                        rel: "approve", href: "https://approve" 
                    }] 
                } 
            }); await expect(h.client.createOrder({
                amount: 12.5, referenceId: "r1", description: "Course", returnUrl: "ok", cancelUrl: "no" 
            })).resolves.toEqual({
                orderId: "o1", approveUrl: "https://approve" 
            }); expect(h.post).toHaveBeenCalledTimes(2) })
        it("returns false for unsuccessful webhook verification",
            async () => { const h = setup(); h.post.mockResolvedValueOnce({
                data: {
                    access_token: "token" 
                } 
            }).mockResolvedValueOnce({
                data: {
                    verification_status: "FAILURE" 
                } 
            }); await expect(h.client.verifyWebhookSignature({
                authAlgo: "SHA256", certUrl: "cert", transmissionId: "id", transmissionSig: "sig", transmissionTime: "now", webhookEvent: {
                } 
            })).resolves.toBe(false) })
        it("treats already-captured errors as idempotent",
            async () => { const h = setup(); h.post.mockResolvedValueOnce({
                data: {
                    access_token: "token" 
                } 
            }).mockRejectedValueOnce({
                response: {
                    data: {
                        details: [{
                            issue: "ORDER_ALREADY_CAPTURED" 
                        }] 
                    } 
                } 
            }); h.post.mockResolvedValueOnce({
                data: {
                    access_token: "token"
                }
            }); h.get.mockResolvedValueOnce({
                data: {
                    id: "o1", status: "COMPLETED", purchase_units: [{
                        custom_id: "r1" 
                    }] 
                } 
            }); await expect(h.client.captureOrder({
                orderId: "o1" 
            })).resolves.toEqual({
                id: "o1", status: "COMPLETED", referenceId: "r1", captured: true 
            }) })
    })
