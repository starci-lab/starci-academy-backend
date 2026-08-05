import {
    Inject,
    Provider,
} from "@nestjs/common"
import {
    SePayPgClient,
} from "sepay-pg-node"
import {
    getSepayApiKey,
} from "@modules/filesystem/utils/mount-secrets"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    SEPAY,
} from "./constants/sepay"

/** Inject the shared SePay PG client (token {@link SEPAY}). */
export const InjectSepay = () => Inject(
    SEPAY,
)

/**
 * Provide the SePay Payment Gateway client.
 *
 * `merchant_id` + environment come from {@link envConfig}; the `secret_key` is
 * read from the mounted secret file (never committed).
 */
export const createSepayProvider = (): Provider<SePayPgClient> => ({
    provide: SEPAY,
    useFactory: (): SePayPgClient => {
        const {
            env,
            merchantId,
        } = envConfig().services.api.sepay
        return new SePayPgClient(
            {
                env: env === "production" ? "production" : "sandbox",
                merchant_id: merchantId,
                secret_key: getSepayApiKey().trim(),
            },
        )
    },
})
