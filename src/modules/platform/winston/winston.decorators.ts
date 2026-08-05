import {
    Inject
} from "@nestjs/common"
import {
    CONSOLE_WINSTON,
    LOKI_WINSTON,
    WINSTON_AND_CONSOLE,
} from "./constants"

/** Injects the console-only Winston instance — use when the line must never ship to Loki. */
export const InjectConsoleWinston = () => Inject(CONSOLE_WINSTON)
/** Injects the Loki-only Winston instance — use when stdout should stay quiet. */
export const InjectLokiWinston = () => Inject(LOKI_WINSTON)
/** Injects the dual Winston (console + Loki) used by most application logs. */
export const InjectWinstonAndConsole = () => Inject(WINSTON_AND_CONSOLE)