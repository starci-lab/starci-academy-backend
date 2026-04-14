/**
 * Configuration for the HTTP module.
 * @returns The configuration for the HTTP module.
 */
export const httpConfig = () => ({
    /** payOS HTTP routes (under global `/api`, version `v1`). */
    payos: () => {
        const tags = "payos"
        return {
            tags,
            createPaymentLink: () => ({
                path: "create-payment-link",
            }),
            paymentRequest: () => ({
                path: "payment-requests",
            }),
            webhook: () => ({
                path: "webhook",
            }),
        }
    },
    sepay: () => {
        const tags = "sepay"
        return {
            tags,
            webhook: () => ({
                path: "webhook",
            }),
        }
    },
    minio: () => {
        const tags = "minio"
        return {
            tags,
            webhook: () => ({
                path: "webhook",
            }),
        }
    },
    // keycloak configuration
    keycloak: () => {
        // tags for the keycloak module
        const keycloakTags = "keycloak"
        return {
            tags: keycloakTags,
            // google configuration
            google: () => {
                // tags for the google module
                const googleTags = `${keycloakTags}/google`
                return {
                    tags: googleTags,
                    // callback configuration
                    callback: () => {
                        // path for the callback endpoint
                        return {
                            path: "callback",
                        }
                    }
                }
            }
        }
    }
})