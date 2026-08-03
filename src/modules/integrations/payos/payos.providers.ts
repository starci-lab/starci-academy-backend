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

export const InjectPayOS = () => Inject(
    PAYOS,
)

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
