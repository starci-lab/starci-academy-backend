import type {
    Provider
} from "@nestjs/common"
import {
    NATS
} from "./constants"

/**
 * Creates a provider for the NATS connection.
 *
 * NATS is currently DISABLED: no connection is established at boot. The initial
 * dial was crash-looping core (e.g. unreachable / unauthenticated broker) and the
 * event fan-out it powers is non-critical for serving the API. The provider
 * resolves to `null`; {@link NatsProducerService.publish} and
 * {@link NatsBridgeService.onModuleInit} no-op on a null connection.
 *
 * To re-enable, restore the `connect(...)` call (see git history) — keep it
 * wrapped so a failed dial never crashes boot.
 *
 * @returns Provider that resolves the NATS token to `null` (disabled)
 *
 * @example
 * Used internally by NatsModule.register().
 */
export const createNatsProvider = (): Provider => ({
    provide: NATS,
    inject: [],
    useFactory: () => null,
})
