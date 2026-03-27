import {
    Inject,
    Provider,
} from "@nestjs/common"
import {
    PayOS,
} from "@payos/node"
import {
    envConfig,
} from "@modules/env"
import {
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
        return new PayOS(
            {
                apiKey: getPayosApiKey().trim(),
                checksumKey: envConfig().payos.checksumKey,
                clientId: envConfig().payos.clientId,
            },
        )
    },
})
