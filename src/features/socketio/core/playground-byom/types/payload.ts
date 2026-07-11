/**
 * Playground BYOM (Bring-Your-Own-Machine) payloads are intentionally FLAT —
 * unlike the rest of the app's Socket.IO surface (which wraps every payload in
 * {@link SocketIoPayload}), this namespace's agent side is a plain
 * `socket.io-client` CLI tool with no notion of the app's `{data, locale}`
 * envelope. The browser side mirrors the same flat shape for symmetry.
 */

/** Agent → server: pair a freshly-started CLI agent with an existing session. */
export interface AgentPairSocketIoPayload {
    /** Short pairing code the learner copied from the browser. */
    pairingCode: string
}

/** Server → agent (ack): result of an `agent:pair` attempt. */
export type AgentPairAck =
    | {
        /** Session the agent is now bound to (also stamped on `socket.data.sessionId`). */
        sessionId: string
        /** Slug of the playground this session runs, so the agent can show context. */
        playgroundSlug: string
        /** Step index the learner is currently on, so the agent can resume context. */
        currentStepIndex: number
    }
    | {
        /** Present when the pairing code is invalid/expired/already connected. */
        error: string
    }

/** Browser → server: join the room for an existing session's realtime relay. */
export interface BrowserSubscribeSocketIoPayload {
    /** Session id the browser wants to observe (known from the route). */
    sessionId: string
}

/** Browser → server: relay a shell command down to the paired agent. */
export interface CommandRunSocketIoPayload {
    /** Session whose paired agent should run the command. */
    sessionId: string
    /** The shell command to run. */
    command: string
}

/**
 * Agent → server: relay one chunk of command output up to the browser.
 * `sessionId` is NOT carried — the gateway derives it from `socket.data.sessionId`
 * (the room the agent joined on `agent:pair`).
 */
export interface CommandOutputSocketIoPayload {
    /** Output text produced by the running command. */
    output: string
}

/** One resource line self-reported by the agent (`docker ps` / `kubectl get ...`). */
export interface PlaygroundResourceReport {
    /** Resource kind, e.g. "Pod", "Deployment", "Service", "Container", "Image", "Node". */
    kind: string
    /** Resource name as reported by the CLI. */
    name: string
    /** Resource status as reported by the CLI (e.g. "Running"). */
    status: string
}

/**
 * Agent → server: self-reported resource snapshot, used for the "lite" verify
 * (no AI grading — a substring/prefix + status match against the current
 * step's expected pattern). `sessionId` is NOT carried — see
 * {@link CommandOutputSocketIoPayload}.
 */
export interface ResourcesReportSocketIoPayload {
    /** Resources currently reported by the agent. */
    resources: Array<PlaygroundResourceReport>
}
