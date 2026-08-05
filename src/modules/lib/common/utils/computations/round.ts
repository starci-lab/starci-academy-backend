import {
    envConfig,
} from "@modules/env"
import Decimal from "decimal.js"

/**
 * HALF_UP round at the env fraction-digit cap so money-ish Decimals do not
 * drift across call sites that each pick a different rounding mode.
 */
export const round = (
    decimal: Decimal,
    fractionDigits = envConfig().computation.round.fractionDigits,
): Decimal => {
    return decimal.toDecimalPlaces(fractionDigits,
        Decimal.ROUND_HALF_UP)
}
