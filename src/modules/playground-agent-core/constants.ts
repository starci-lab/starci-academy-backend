/**
 * Wire event names — MUST match the server `PublicationEvent` enum verbatim.
 * The full set lives here so every agent shares one vocabulary; a capability
 * that doesn't use an event (e.g. the RAG agent ignores `resourcesReport`)
 * simply never emits/listens for it.
 */
export const EVENT = {
    pair: "agent:pair",
    commandRun: "command:run",
    commandOutput: "command:output",
    resourcesReport: "resources:report",
    stepVerified: "step:verified",
    ping: "agent:ping",
    pong: "agent:pong",
    verifyNow: "verify:now",
    deviceInfo: "device:info",
    log: "agent:log",
    ollamaStatus: "ollama:status",
    ragIndex: "rag:index",
    ragAsk: "rag:ask",
    ragAnswer: "rag:answer",
    ragCitations: "rag:citations",
    ragEvent: "rag:event",
} as const

/** Namespace served by the StarCi `PlaygroundByomGateway`. */
export const NAMESPACE = "/playground_byom"

/** How often (ms) to push a fresh resource snapshot even without a command. */
export const RESOURCE_INTERVAL_MS = 5000

/** Default StarCi API origin (prod) — overridable via `--server` or `STARCI_PLAYGROUND_SERVER`. */
export const DEFAULT_SERVER = "wss://api.academy.starci.org"
