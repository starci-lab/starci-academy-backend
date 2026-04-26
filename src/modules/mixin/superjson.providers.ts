import {
    Inject,
    Provider
} from "@nestjs/common"
import SuperJSON from "superjson"
import BN from "bn.js"
import {
    PublicKey
} from "@solana/web3.js"
import Decimal from "decimal.js"
import dayjs, {
    Dayjs
} from "dayjs"
import {
    SUPERJSON
} from "./constants"
import {
    ScalableBloomFilter 
} from "bloom-filters"

/**
 * Inject the SuperJSON service.
 */
export const InjectSuperJson = () => Inject(SUPERJSON)
/**
 * Create a provider for the SuperJSON service.
 */

export const createSuperJsonServiceProvider = (): Provider<SuperJSON> => ({
    provide: SUPERJSON,
    useFactory: () => {
        const superjson = new SuperJSON()
        // extends bn
        superjson.registerCustom<BN, string>(
            {
                isApplicable: (v): v is BN => {
                    try {
                        return BN.isBN(v)
                    } catch {
                        return false
                    }
                },
                serialize: (v) => v.toString(),
                deserialize: (v) => new BN(v),
            },
            "bn.js" // identifier
        )
        superjson.registerCustom<PublicKey, string>(
            {
                isApplicable: (v): v is PublicKey => {
                    return v instanceof PublicKey
                },
                serialize: (v) => v.toString(),
                deserialize: (v) => new PublicKey(v),
            },
            "solana.web3.js.PublicKey" // identifier
        )
        superjson.registerCustom<Decimal, string>(
            {
                isApplicable: (v): v is Decimal => {
                    return Decimal.isDecimal(v)
                },
                serialize: (v) => v.toString(),
                deserialize: (v) => new Decimal(v),
            },
            "decimal.js" // identifier
        )
        superjson.registerCustom<Dayjs, string>(
            {
                isApplicable: (v): v is Dayjs => {
                    return dayjs.isDayjs(v)
                },
                serialize: (v) => v.toISOString(),
                deserialize: (v) => dayjs(v),
            },
            "dayjs" // identifier
        )
        superjson.registerCustom<ScalableBloomFilter, string>(
            {
                isApplicable: (v): v is ScalableBloomFilter => {
                    return v instanceof ScalableBloomFilter
                },
                serialize: (v) => JSON.stringify(v.saveAsJSON()),
                deserialize: (v) => ScalableBloomFilter.fromJSON(JSON.parse(v)),
            },
            "bloom-filters.ScalableBloomFilter" // identifier
        )
        return superjson
    },
})