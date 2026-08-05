import {
    bnMulDecimal,
} from "./operation"
import BN from "bn.js"
import Decimal from "decimal.js"

/**
 * Shrinks an on-chain BN amount by `(1 - slippage)` so a swap still lands when
 * the pool moves between quote and submit. Passing the quoted size unchanged
 * reverts on any adverse tick.
 */
export const adjustSlippage = (
    {
        bn,
        slippage,
        fractionDigits ,
        isRoundUp,
    }: AdjustSlippageParams,
): BN => {
    return bnMulDecimal({
        bn,
        decimal: new Decimal(1).sub(slippage),
        fractionDigits,
        isRoundUp,
    })
}

/**
 * Inputs for {@link adjustSlippage}. `fractionDigits` / `isRoundUp` control the
 * BNxDecimal scale so a tight slippage does not round the buffer away.
 */
export interface AdjustSlippageParams {
    bn: BN
    slippage: Decimal
    fractionDigits?: Decimal
    isRoundUp?: boolean
}
