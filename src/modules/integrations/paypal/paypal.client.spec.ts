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
        it("returns an empty approval URL when PayPal omits an approval link",
            async () => {
                const h = setup()
                h.post.mockResolvedValueOnce({
                    data: {
                        access_token: "token",
                    },
                }).mockResolvedValueOnce({
                    data: {
                        id: "o2",
                        links: [],
                    },
                })

                await expect(h.client.createOrder({
                    amount: 1,
                    referenceId: "r2",
                    description: "Course",
                    returnUrl: "ok",
                    cancelUrl: "no",
                })).resolves.toEqual({
                    orderId: "o2",
                    approveUrl: "",
                })
            })

        it("uses an empty purchase-unit list when retrieving an order",
            async () => {
                const h = setup()
                h.post.mockResolvedValueOnce({
                    data: {
                        access_token: "token",
                    },
                })
                h.get.mockResolvedValueOnce({
                    data: {
                        id: "o3",
                        status: "CREATED",
                    },
                })

                await expect(h.client.retrieveOrder({
                    orderId: "o3"
                })).resolves.toEqual({
                    id: "o3",
                    status: "CREATED",
                    referenceId: undefined,
                })
            })

        it("reports a non-completed capture as not captured",
            async () => {
                const h = setup()
                h.post.mockResolvedValueOnce({
                    data: {
                        access_token: "token",
                    },
                }).mockResolvedValueOnce({
                    data: {
                        id: "o4",
                        status: "PENDING",
                        purchase_units: [],
                    },
                })

                await expect(h.client.captureOrder({
                    orderId: "o4"
                })).resolves.toEqual({
                    id: "o4",
                    status: "PENDING",
                    referenceId: undefined,
                    captured: false,
                })
            })

        it("handles a capture response with no purchase units",
            async () => {
                const h = setup()
                h.post.mockResolvedValueOnce({
                    data: {
                        access_token: "token",
                    },
                }).mockResolvedValueOnce({
                    data: {
                        id: "o-no-units",
                        status: "COMPLETED",
                    },
                })

                await expect(h.client.captureOrder({
                    orderId: "o-no-units",
                })).resolves.toEqual({
                    id: "o-no-units",
                    status: "COMPLETED",
                    referenceId: undefined,
                    captured: true,
                })
            })

        it("accepts an order response with no links collection",
            async () => {
                const h = setup()
                h.post.mockResolvedValueOnce({
                    data: {
                        access_token: "token",
                    },
                }).mockResolvedValueOnce({
                    data: {
                        id: "o-no-links",
                    },
                })

                await expect(h.client.createOrder({
                    amount: 2,
                    referenceId: "r-no-links",
                    description: "Course",
                    returnUrl: "ok",
                    cancelUrl: "no",
                })).resolves.toEqual({
                    orderId: "o-no-links",
                    approveUrl: "",
                })
            })

        it("propagates capture errors that are not already-captured responses",
            async () => {
                const h = setup()
                const failure = new Error("capture unavailable")
                h.post.mockResolvedValueOnce({
                    data: {
                        access_token: "token",
                    },
                }).mockRejectedValueOnce(failure)

                await expect(h.client.captureOrder({
                    orderId: "o5"
                })).rejects.toBe(failure)
            })
    })
