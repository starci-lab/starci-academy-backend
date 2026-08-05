/** Winston log level. */
export enum WinstonLevel {
    /** Diagnostic detail -- usually console-only, not paged on. */
    Debug = "debug",
    /** Routine success / progress -- expected in Loki for ops timelines. */
    Info = "info",
    /** Recoverable anomaly -- investigate if it clusters, do not page yet. */
    Warn = "warn",
    /** Failed operation -- caller already aborted; alert if the rate spikes. */
    Error = "error",
    /** Process-threatening failure -- page immediately. */
    Fatal = "fatal",
    /** Extra-noisy trace beneath debug -- local troubleshooting only. */
    Verbose = "verbose",
}

/** Winston log transport type. */
export enum WinstonLogType {
    /** Writes to stdout for local/pod logs. */
    Console = "console",
    /** Ships to Grafana Loki for searchable long-term logs. */
    Loki = "loki",
}
