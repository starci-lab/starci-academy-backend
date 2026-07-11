import type {
    PlaygroundResourceReport,
} from "./payload"

/** Server → agent: relay a shell command the browser asked to run. */
export interface CommandRunSocketIoMessage {
    /** The shell command to run. */
    command: string
}

/** Server → browser: relay one chunk of command output from the agent. */
export interface CommandOutputSocketIoMessage {
    /** Output text produced by the running command. */
    output: string
}

/** Server → browser: relay the agent's latest self-reported resource snapshot. */
export interface ResourcesReportSocketIoMessage {
    /** Resources currently reported by the agent. */
    resources: Array<PlaygroundResourceReport>
}

/** Server → browser: a step's "lite" verify pattern matched the reported resources. */
export interface StepVerifiedSocketIoMessage {
    /** Index (into the playground's ordered steps) that was just verified as passed. */
    stepIndex: number
}
