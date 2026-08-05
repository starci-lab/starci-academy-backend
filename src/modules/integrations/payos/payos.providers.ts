import {
    Inject,
    Provider,
} from "@nestjs/common"
import {
    PayOS,
} from "@payos/node"
import {
    getAppConfig,
    getPayosApiKey,
} from "@modules/filesystem"
import {
    PAYOS,
} from "./constants"

/** Inject the shared PayOS SDK client (token {@link PAYOS}). */
export const InjectPayOS = () => Inject(
    PAYOS,
)

/**
 * Construct the PayOS SDK from mounted secrets + app config. Credentials stay
 * out of env vars; an empty key still constructs so local boot does not crash,
 * but live calls fail until the secret is mounted.
 */
export const createPayosProvider = (): Provider<PayOS> => ({
    provide: PAYOS,
    useFactory: (): PayOS => {
        const app = getAppConfig()
        return new PayOS(
            {
                apiKey: getPayosApiKey().trim(),
                checksumKey: app.payos?.checksumKey?.trim(),
                clientId: app.payos?.clientId?.trim()
            },
        )
    },
})
