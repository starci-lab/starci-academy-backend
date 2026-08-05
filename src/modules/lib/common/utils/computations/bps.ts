import Decimal from "decimal.js"

const BPS_FACTOR = 10_000

/**
 * Maps a 0-1 Decimal fee/slippage into basis points (x10_000) so config that
 * stores integers does not get a 0.005 written as 0 and silently drop the fee.
 */
export const decimalToBps = (decimal: Decimal): Decimal =>
    decimal.mul(BPS_FACTOR)

/**
 * Maps integer basis points back to a 0-1 Decimal. Inverse of
 * {@link decimalToBps} -- skipping it off-by-100x a rate when UI and chain disagree.
 */
export const bpsToDecimal = (bps: Decimal): Decimal =>
    bps.div(BPS_FACTOR)
