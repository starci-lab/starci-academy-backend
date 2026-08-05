import {
    envConfig,
} from "@modules/platform/env/config"
import BN from "bn.js"
import Decimal from "decimal.js"
import {
    pow10,
} from "./pow-10"

/**
 * Inputs for {@link bnMulDecimal}. Named (not inline) so call sites share one
 * rounding contract -- `isRoundUp` decides whether a partial unit is kept.
 */
export interface BnMulDecimalParams {
    // the amount to convert to a decimal
    bn: BN
    // the number of decimals to use
    decimal: Decimal
    // the number of fraction digits to use
    fractionDigits?: Decimal
    // round up or down
    isRoundUp?: boolean
}

/**
 * Multiplies a BN by a Decimal and returns a BN
 * @param bn - The BN to multiply
 * @param decimal - The Decimal to multiply
 * @param fractionDigits - The number of fraction digits to use
 * @returns The result of the multiplication
 */
export const bnMulDecimal = ({
    bn,
    decimal,
    fractionDigits = new Decimal(
        envConfig().computation.operation.fractionDigits,
    ),
    isRoundUp = false,
}: BnMulDecimalParams): BN => {

    // precision used to safely multiply Decimal
    const precisionFactor = pow10({
        exponent: fractionDigits,
        asBN: false,
    })

    // (decimal * decimalsFactor) scaled to integer
    const scaledDecimal = new BN(
        decimal
            .mul(precisionFactor)
            .toFixed(
                0,
                isRoundUp ? Decimal.ROUND_HALF_UP : Decimal.ROUND_HALF_DOWN,
            ),
    )

    // bn * scaledDecimal / precisionFactor
    return bn
        .mul(scaledDecimal)
        .div(new BN(precisionFactor.toString()))
}

/**
 * Divides a BN by a Decimal and returns a BN
 * @param bn - The BN to divide
 * @param decimal - The Decimal to divide
 * @param fractionDigits - The number of fraction digits to use
 * @returns The result of the division
 */
export interface BnDivDecimalParams {
    // the amount to convert to a decimal
    bn: BN
    // the number of decimals to use
    decimal: Decimal
    // the number of fraction digits to use
    fractionDigits?: Decimal
}

/**
 * Divides a BN by a Decimal via reciprocal multiply so BN stays integer-only
 * and a fractional divisor cannot throw or truncate to zero mid-scale.
 */
export const bnDivDecimal = ({
    bn,
    decimal,
    fractionDigits = new Decimal(
        envConfig().computation.operation.fractionDigits,
    ),
}: BnDivDecimalParams): BN => {
    return bnMulDecimal({
        bn,
        decimal: new Decimal(1).div(decimal),
        fractionDigits,
    })
}

/**
 * BN÷BN as a Decimal with explicit scale. Direct `bn1/bn2` would floor to 0
 * for ratios below 1, which silently zeros fees and shares.
 */
export const bnDivBn = ({
    bn1,
    bn2,
    fractionDigits = new Decimal(
        envConfig().computation.operation.fractionDigits,
    ),
}: BnDivBnParams): Decimal => {
    const multiplier = pow10({
        exponent: fractionDigits,
        asBN: true,
    })
    return new Decimal(bn1.mul(multiplier).div(bn2).toString())
        .div(new Decimal(multiplier.toString()))
        .toDecimalPlaces(
            fractionDigits.toNumber(),
            Decimal.ROUND_HALF_UP,
        )
}

/**
 * Inputs for {@link bnDivBn}. `fractionDigits` is the kept scale after the
 * ratio -- too low and a tiny share rounds to 0.
 */
export interface BnDivBnParams {
    bn1: BN
    bn2: BN
    fractionDigits?: Decimal
}
