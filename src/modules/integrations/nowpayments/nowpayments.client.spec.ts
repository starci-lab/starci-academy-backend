import {
    NowPaymentsClient 
} from "./nowpayments.client"

describe("NowPaymentsClient",
    () => {
        const build = () => {
            const http = {
                post: jest.fn(), get: jest.fn() 
            }
            const axiosService = {
                create: jest.fn().mockReturnValue(http) 
            }
            return {
                service: new NowPaymentsClient(axiosService as never), http, axiosService 
            }
        }

        it("creates an invoice and normalizes provider identifiers",
            async () => {
                const { service, http } = build()
                http.post.mockResolvedValue({
                    data: {
                        id: 42, invoice_url: "https://pay.test/42" 
                    } 
                })
                await expect(service.createInvoice({
                    amount: 12, referenceId: "txn-1", description: "Course", successUrl: "ok", cancelUrl: "cancel" 
                })).resolves.toEqual({
                    invoiceId: "42", invoiceUrl: "https://pay.test/42" 
                })
                expect(http.post).toHaveBeenCalledWith("/invoice",
                    expect.objectContaining({
                        order_id: "txn-1", price_amount: 12 
                    }),
                    expect.objectContaining({
                        headers: expect.objectContaining({
                            "x-api-key": expect.any(String) 
                        }) 
                    }))
            })

        it.each([
            [{
                data: [{
                    payment_status: "finished" 
                },
                {
                    payment_status: "waiting" 
                }] 
            },
            {
                paid: true, empty: false, statuses: ["finished",
                    "waiting"] 
            }],
            [{
                data: [{
                    payment_status: "confirmed" 
                }] 
            },
            {
                paid: true, empty: false, statuses: ["confirmed"] 
            }],
            [{
                data: [] 
            },
            {
                paid: false, empty: true, statuses: [] 
            }],
            [{
                data: "invalid" 
            },
            {
                paid: false, empty: true, statuses: [] 
            }],
        ])("classifies invoice statuses",
            async (response, expected) => {
                const { service, http } = build()
                http.get.mockResolvedValue({
                    data: response 
                })
                await expect(service.getInvoiceStatus("inv-1")).resolves.toEqual(expected)
            })

        it("verifies sorted nested signatures and rejects mismatches",
            () => {
                const { service } = build()
                expect(service.verifySignature({
                    body: {
                        z: 1, nested: {
                            b: 2, a: 1 
                        } 
                    }, signature: "invalid" 
                })).toBe(false)
            })
    })
