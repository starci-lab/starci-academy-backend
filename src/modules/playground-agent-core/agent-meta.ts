/**
 * Per-agent identity, injected via {@link AGENT_META}. Lets the SHARED relay,
 * CLI command, and service-installer print the right names / package while the
 * three apps (docker / k8s / rag) reuse the exact same code.
 */
export interface AgentMeta {
    /** CLI binary name a learner types, e.g. `playground-docker-agent`. */
    cliName: string
    /** Published package, e.g. `@starciacademy/playground-docker-agent`. */
    packageName: string
    /** Logger context + human label for this agent. */
    label: string
    /** One-line description shown in `--help`. */
    description: string
    /** The "ready" line streamed to the browser after a successful pair. */
    readyMessage: string
    /** Windows Scheduled Task name (must be unique per agent so the three can coexist). */
    taskName: string
    /** systemd user unit filename (unique per agent). */
    systemdUnit: string
    /** launchd label (unique per agent). */
    launchdLabel: string
}

/** DI token for the current agent's {@link AgentMeta}. */
export const AGENT_META = Symbol("STARCI_AGENT_META")
