import type {
    AiExecutionError,
} from "./execution-errors"
import type {
    AiExecutionView,
} from "./execution-view"

/** Result shared by lease and terminal transition commands. */
export type ExecutionTransitionResult = {
    ok: true
    replayed: boolean
    execution: AiExecutionView
    leaseToken?: string
} | {
    ok: false
    error: AiExecutionError
}
