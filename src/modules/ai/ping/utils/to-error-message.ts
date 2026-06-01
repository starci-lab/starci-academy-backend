import {
    PING_ERROR_MESSAGE_MAX_LEN,
} from "../constants"

/**
 * Normalize an unknown thrown value into a short ping error string.
 * @param err - Value caught from a provider ping call.
 * @returns Truncated error message suitable for logs and key health state.
 */
export const toPingErrorMessage = (err: unknown): string => {
    if (err instanceof Error) {
        return err.message.slice(
            0,
            PING_ERROR_MESSAGE_MAX_LEN,
        )
    }
    return String(err).slice(
        0,
        PING_ERROR_MESSAGE_MAX_LEN,
    )
}
