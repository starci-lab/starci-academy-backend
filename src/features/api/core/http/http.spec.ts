import {
    httpConfig
} from "./http"

describe("httpConfig",
    () => {
        it("builds stable grouped route metadata",
            () => {
                const config = httpConfig()
                expect(config.payos().createPaymentLink()).toEqual({
                    path: "create-payment-link"
                })
                expect(config.payos().tags).toBe("payos"); expect(config.keycloak().google().tags).toBe("keycloak/google"); expect(config.keycloak().auth().configureMailAdapter()).toEqual({
                    path: "configure-mail-adapter"
                })
            })
        it("exposes webhook and admin paths",
            () => { const config = httpConfig(); expect(config.stripe().webhook().path).toBe("webhook"); expect(config.admin().viewPresignedUrl().path).toBe("view-presigned-url"); expect(config.mount().foundations().path).toBe("foundations") })
    })
