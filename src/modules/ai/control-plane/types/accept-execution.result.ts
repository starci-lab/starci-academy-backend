import type {
    AiExecutionError,
} from "./execution-errors"
import type {
    AiExecutionView,
} from "./execution-view"

/** Result of an accept command, including exact idempotent replay. */
export type AcceptExecutionResult = {
    ok: true
    replayed: boolean
    execution: AiExecutionView
} | {
    ok: false
    error: AiExecutionError
}
