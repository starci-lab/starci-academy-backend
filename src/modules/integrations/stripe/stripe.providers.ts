import {
    Inject,
    Provider,
} from "@nestjs/common"
import Stripe from "stripe"
import type {
    Stripe as StripeClient,
} from "stripe"
import {
    getStripeSecretKey,
} from "@modules/filesystem/utils/mount-secrets"
import {
    STRIPE,
} from "./constants/stripe"

/** Inject the shared Stripe SDK client (token {@link STRIPE}). */
export const InjectStripe = () => Inject(
    STRIPE,
)

/**
 * Provide the Stripe SDK client.
 *
 * The secret key is read from the mounted secret file (never committed / never an
 * env var), mirroring how the PayOS/Sepay providers load their credentials.
 */
export const createStripeProvider = (): Provider<StripeClient> => ({
    provide: STRIPE,
    useFactory: (): StripeClient => {
        // read the secret key from the mount file (empty in dev -> SDK constructs but calls fail)
        const secretKey = getStripeSecretKey().trim()
        // construct the SDK client; apiVersion omitted so the account default applies
        return new Stripe(
            secretKey,
        )
    },
})
