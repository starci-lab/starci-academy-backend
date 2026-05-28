import {
    SePayPgClient,
} from "sepay-pg-node"

/**
 * SePay client = the official Payment Gateway SDK client. Aliased as `Sepay`
 * so existing injection sites (`InjectSepay()` → `Sepay`) keep working.
 */
export { SePayPgClient as Sepay }
export type SepayClient = SePayPgClient
