import {
    randomInt,
} from "node:crypto"

/**
 * 2020-01-01T00:00:00Z. Subtracted from the clock so the millisecond count leaves room for the
 * random suffix below without the product ever exceeding the gateways' integer ceiling.
 */
const ORDER_CODE_EPOCH_MS = Date.UTC(2020,
    0,
    1)

/**
 * Distinct codes available within one millisecond.
 *
 * PayOS and SePay both cap an order code at 2^53-1. At 8192 slots the generated value stays under
 * that ceiling until roughly 2054, which is the trade being made: more slots would shorten that
 * date, fewer would raise the odds of two orders in one millisecond drawing the same number.
 */
const ORDER_CODE_SLOTS = 8192

/**
 * A gateway order code.
 *
 * IT HAS TO BE AN INTEGER. PayOS and SePay both reject anything else, so this cannot be a UUID
 * however much the job it does -- identify one order, uniquely -- asks for one.
 *
 * The previous spelling was `Date.now() * 1000 + Math.random() * 1000`, which gave two orders
 * created in the same millisecond a 1-in-1000 chance of the same code. That code is also stored as
 * the transaction's `referenceId`, and reconciliation reads the gateway back by exactly that value,
 * so a clash does not fail loudly -- it attributes one order's payment to the other order's
 * transaction. This draws from the CSPRNG instead of `Math.random` and widens the per-millisecond
 * space eightfold.
 *
 * THAT REDUCES THE ODDS; IT DOES NOT REMOVE THEM. `reference_id` carries no unique index, so a
 * collision is still silent when it happens. Closing it for good needs that index plus
 * regenerate-on-conflict, which is a migration this function cannot perform on its own.
 */
export const generateOrderCode = (): number =>
    (Date.now() - ORDER_CODE_EPOCH_MS) * ORDER_CODE_SLOTS + randomInt(ORDER_CODE_SLOTS)
