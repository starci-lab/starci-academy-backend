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
    /** Stripe webhook route (under global `/api`, version `v1`). */
    stripe: () => {
        const tags = "stripe"
        return {
            tags,
            webhook: () => ({
                path: "webhook",
            }),
        }
    },
    /** PayPal webhook route (under global `/api`, version `v1`). */
    paypal: () => {
        const tags = "paypal"
        return {
            tags,
            webhook: () => ({
                path: "webhook",
            }),
        }
    },
    /** NOWPayments IPN route (under global `/api`, version `v1`). */
    nowpayments: () => {
        const tags = "nowpayments"
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
    // github configuration (OAuth directly from GitHub)
    github: () => {
        const githubTags = "github"
        return {
            tags: githubTags,
            oauth: () => ({
                tags: `${githubTags}/oauth`,
                redirect: () => ({
                    path: "redirect",
                }),
                callback: () => ({
                    path: "callback",
                }),
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
                    redirect: () => ({
                        path: "redirect",
                    }),
                    // callback configuration
                    callback: () => {
                        // path for the callback endpoint
                        return {
                            path: "callback",
                        }
                    }
                }
            },
            // github configuration
            github: () => {
                const githubTags = `${keycloakTags}/github`
                return {
                    tags: githubTags,
                    redirect: () => ({
                        path: "redirect",
                    }),
                    callback: () => ({
                        path: "callback",
                    }),
                }
            },
            auth: () => {
                const authTags = `${keycloakTags}/auth`
                return {
                    tags: authTags,
                    login: () => ({
                        path: "login",
                    }),
                    register: () => ({
                        path: "register",
                    }),
                    configureMailAdapter: () => ({
                        path: "configure-mail-adapter",
                    }),
                }
            }
        }
    },
    /** Public mount files under `.mount/data/foundations`. */
    mount: () => {
        const tags = "mount"
        return {
            tags,
            foundations: () => ({
                path: "foundations",
            }),
        }
    },
    /** Admin HTTP routes. */
    admin: () => {
        const tags = "admin"
        return {
            tags,
            presignedUrl: () => ({
                path: "presigned-url",
            }),
            processVideo: () => ({
                path: "process-video",
            }),
            viewPresignedUrl: () => ({
                path: "view-presigned-url",
            }),
        }
    },
    /** Profile HTTP routes (authenticated; under global `/api`, version `v1`). */
    profile: () => {
        const tags = "profile"
        return {
            tags,
            uploadAvatar: () => ({
                path: "avatar",
            }),
        }
    },
})