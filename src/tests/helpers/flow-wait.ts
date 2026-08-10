/**
 * Waiting primitives for flow tests.
 *
 * THESE EXIST TO KILL `sleep`. A fixed sleep is wrong in both directions at once: too short and the
 * suite goes red for a reason that is not a defect, too long and every run pays for the worst case
 * -- and both get "fixed" by raising the number, which buys neither correctness nor speed.
 *
 * What replaces it is a deadline plus a predicate, and the deadline is itself an assertion: "this
 * settles within N seconds" is a claim about the system, and when it fails the message says what
 * was being waited for rather than leaving a reader to guess.
 *
 * See `be/canon/patterns/e2e-flow.md` FLOW-3, FLOW-5 and FLOW-6.
 */

/** How long a wait runs before it gives up and says what it wanted. */
const DEFAULT_TIMEOUT_MS = 10_000

/** How often a predicate is re-checked. Short enough to stay quick, long enough not to thrash. */
const DEFAULT_INTERVAL_MS = 50

/** How long an absence is observed before it counts as absence. */
const DEFAULT_SILENCE_MS = 1_000

/** What a wait is for, and how long it may take. */
export interface WaitOptions {
    /** Deadline in milliseconds. Exceeding it fails the step. */
    timeout?: number
    /** Poll interval in milliseconds. */
    interval?: number
    /** What is being waited for, in words, for the failure message. */
    describe?: string
}

/** A minimal socket surface, so this file does not depend on a particular client library. */
export interface MessageSource {
    /** Subscribe to an event. */
    on: (event: string, listener: (payload: unknown) => void) => unknown
    /** Unsubscribe a listener. */
    off: (event: string, listener: (payload: unknown) => void) => unknown
}

const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => {
        setTimeout(resolve,
            ms)
    })

/**
 * Wait until a predicate holds, then return.
 *
 * The predicate may be async and may throw while the state is still settling -- a row that does not
 * exist yet makes `findOneOrFail` throw, and that is a "not yet", not a failure. Only the deadline
 * fails the step.
 *
 * @param predicate - Re-checked until it returns truthy.
 * @param options - {@link WaitOptions}.
 * @throws when the deadline passes, naming what was awaited and for how long.
 */
export const until = async (
    predicate: () => boolean | Promise<boolean>,
    options: WaitOptions = {
    },
): Promise<void> => {
    const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS
    const interval = options.interval ?? DEFAULT_INTERVAL_MS
    const what = options.describe ?? "the condition to hold"
    const startedAt = Date.now()
    let lastError: unknown

    for (;;) {
        try {
            if (await predicate()) {
                return
            }
            lastError = undefined
        } catch (error) {
            // still settling: a row that is not written yet throws rather than returning false
            lastError = error
        }

        const waited = Date.now() - startedAt
        if (waited >= timeout) {
            const because = lastError instanceof Error
                ? ` The last attempt threw: ${lastError.message}`
                : ""
            throw new Error(
                `Timed out after ${waited}ms waiting for ${what}.${because}`,
            )
        }
        await sleep(interval)
    }
}

/**
 * Wait for the next message on an event that matches a predicate, and return it.
 *
 * ASSERT WHAT ARRIVED, NEVER HOW MANY. A count encodes how many listeners happen to be connected:
 * a third subscriber reddens a correct system, and delivering the wrong payload to the right number
 * of people keeps a broken one green. So this hands back the message, and the caller asserts its
 * content and its recipient.
 *
 * @param source - Anything with `on`/`off`.
 * @param event - The event name.
 * @param matches - Which message this step is waiting for. Defaults to the next one.
 * @param options - {@link WaitOptions}.
 * @returns the first matching payload.
 * @throws when the deadline passes before one arrives.
 */
export const nextMessage = async <TPayload = unknown>(
    source: MessageSource,
    event: string,
    matches: (payload: TPayload) => boolean = () => true,
    options: WaitOptions = {
    },
): Promise<TPayload> => {
    const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS
    const what = options.describe ?? `a \`${event}\` message`

    return new Promise<TPayload>((resolve, reject) => {
        // the listener is attached BEFORE the timer, so a message that arrives immediately is not
        // lost to a race with the deadline
        const listener = (payload: unknown): void => {
            if (!matches(payload as TPayload)) {
                return
            }
            settle()
            resolve(payload as TPayload)
        }
        const timer = setTimeout(() => {
            settle()
            reject(new Error(`Timed out after ${timeout}ms waiting for ${what}.`))
        },
        timeout)

        /** Detach exactly once, whichever way this ends. */
        const settle = (): void => {
            clearTimeout(timer)
            source.off(event,
                listener)
        }

        source.on(event,
            listener)
    })
}

/**
 * Assert that NO matching message arrives within a window.
 *
 * This is the assertion a flow suite is usually missing, and it is the only one that catches a
 * system broadcasting everything to everybody -- a failure every positive assertion in the file
 * passes straight through, because the right people did receive their message.
 *
 * @param source - Anything with `on`/`off`.
 * @param event - The event name.
 * @param matches - Which message would be a failure. Defaults to any.
 * @param options - `within` is the silence window.
 * @throws when a matching message arrives.
 */
export const expectNoMessage = async <TPayload = unknown>(
    source: MessageSource,
    event: string,
    matches: (payload: TPayload) => boolean = () => true,
    options: { within?: number } = {
    },
): Promise<void> => {
    const within = options.within ?? DEFAULT_SILENCE_MS
    let received: TPayload | undefined

    const listener = (payload: unknown): void => {
        if (!matches(payload as TPayload)) {
            return
        }
        received ??= payload as TPayload
    }

    source.on(event,
        listener)
    try {
        await sleep(within)
    } finally {
        source.off(event,
            listener)
    }

    if (received !== undefined) {
        throw new Error(
            `Expected no \`${event}\` message within ${within}ms, but one arrived: `
            + `${JSON.stringify(received)}`,
        )
    }
}
