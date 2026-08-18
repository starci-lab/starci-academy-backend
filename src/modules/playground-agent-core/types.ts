/**
 * One resource as the StarCi gateway expects it: an EXACT `kind`, a `name` the
 * server substring-matches against the step's pattern, and a `status` the server
 * EXACT-matches against the step's expected status (or ignores when none).
 */
export interface PlaygroundResource {
    kind: string
    name: string
    status: string
}

/** Hardware/OS snapshot of the learner's machine, sent once on pair. */
export interface DeviceInfo {
    platform: string
    release: string
    arch: string
    hostname: string
    cpuModel: string
    cpuCores: number
    totalMemBytes: number
    freeMemBytes: number
    /** First discrete GPU name, or null if it couldn't be read (best-effort). */
    gpu: string | null
    /** Free GPU VRAM in MiB (NVIDIA only via nvidia-smi); undefined if unavailable. */
    vramFreeMb?: number
    /** Total GPU VRAM in MiB (NVIDIA only via nvidia-smi); undefined if unavailable. */
    vramTotalMb?: number
}

/** Best-effort NVIDIA GPU name + VRAM read via `nvidia-smi` -- empty fields when absent/unreadable. */
export interface NvidiaVramInfo {
    vramFreeMb?: number
    vramTotalMb?: number
    gpu?: string
}

/** The gateway's ack payload for a successful `agent:pair`. */
export interface PairAck {
    sessionId?: string
    playgroundSlug?: string
    currentStepIndex?: number
    error?: string
}

/** run (default) | install-service | uninstall-service. */
export type AgentMode = "run" | "install" | "uninstall"

/** A single OS command to run as `file arg arg ...` (argv, quoting-safe + testable). */
export interface ServiceCommand {
    file: string
    args: Array<string>
}

/** A single file to write as part of installing a service (destination path + contents). */
export interface ServiceManifest {
    path: string
    content: string
}

/** Everything needed to install/uninstall a service, as PURE DATA (printable + unit-testable). */
export interface ServiceDefinition {
    platform: NodeJS.Platform
    label: string
    manifest: ServiceManifest
    installCommands: Array<ServiceCommand>
    uninstallCommands: Array<ServiceCommand>
    removeOnUninstall: Array<string>
    notes: Array<string>
}

/** Inputs resolved once, then handed to the platform builders. */
export interface ServiceInput {
    platform: NodeJS.Platform
    nodePath: string
    scriptPath: string
    pairingCode: string
    server: string
    home: string
    temp: string
}
