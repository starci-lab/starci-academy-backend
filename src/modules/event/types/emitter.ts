import {
    EventName,
} from "../enums"
import {
    configMap,
} from "../config"

/** Emit options. */
export interface EmitOptions {
    /** When true, publishes the event over NATS; overrides the per-event config default. */
    useNats?: boolean
    /** When true, emits the event on the in-process EventEmitter; overrides the per-event config default. */
    useLocal?: boolean
}

/** Emit parameters. */
export interface EmitParams<T extends EventName> {
    /** The event name to emit. */
    event: T
    /** Dynamic segments folded into the resolved event name (via getEventName). */
    args?: Array<unknown>
    /** The typed payload for this event, as declared in the event config map. */
    payload: (typeof configMap)[T]["eventPayload"]
    /** Optional transport overrides (local/NATS) for this emit. */
    options?: EmitOptions
}

/** On parameters. */
export interface OnParams<T extends EventName> {
    /** The event name to subscribe to. */
    event: T
    /** Dynamic segments folded into the resolved event name (via getEventName). */
    args?: Array<unknown>
    /** Listener invoked with the event payload each time the event fires. */
    listener: (payload: (typeof configMap)[T]["eventPayload"]) => void
}

/** Off parameters. */
export interface OffParams<T extends EventName> {
    /** The event name to unsubscribe from. */
    event: T
    /** Dynamic segments folded into the resolved event name (via getEventName). */
    args?: Array<unknown>
    /** The previously registered listener to remove. */
    listener: (payload: (typeof configMap)[T]["eventPayload"]) => void
}
