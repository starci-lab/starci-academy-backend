import type {
    NatsOptions,
} from "../nats/types"

/** Event module registration options. */
export interface EventOptions {
    /** Optional NATS configuration; when provided, enables the NATS transport bridge. */
    nats?: NatsOptions
}
