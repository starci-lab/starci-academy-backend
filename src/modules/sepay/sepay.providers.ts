import {
    Inject,
    Provider,
} from "@nestjs/common"
import {
    getSepayApiKey,
} from "@modules/filesystem"
import {
    SEPAY,
} from "./constants"
import {
    Sepay,
} from "./sepay.client"

export const InjectSepay = () => Inject(
    SEPAY,
)

// Function to create sepay provider
export const createSepayProvider = (): Provider<Sepay> => ({
    provide: SEPAY,
    useFactory: (): Sepay => {
        return new Sepay(
            {
                apiKey: getSepayApiKey().trim(),
            },
        )
    },
})
