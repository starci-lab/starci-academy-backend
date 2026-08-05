/* eslint-disable starci-be/no-nest-logger --
 * Standalone playground agent CLI: Nest Logger is the operator-facing console
 * (pair/run/shutdown). This process does not mount WinstonModule.
 */
import {
    Inject, Injectable, Logger,
} from "@nestjs/common"
import {
    spawn 
} from "node:child_process"
import {
    io, type Socket 
} from "socket.io-client"
import {
    AGENT_META, type AgentMeta 
} from "./agent-meta"
import {
    EVENT, NAMESPACE 
} from "./constants"
import {
    DeviceService 
} from "./device.service"
import type {
    PairAck 
} from "./types"

@Injectable()
/**
 * The long-running relay every agent shares: connects to the `/playground_byom`
 * namespace, pairs with a session (short-lived pairing code), streams device
 * info + logs, runs browser-issued commands, and answers ping. Each capability
 * (docker / k8s / rag) subclasses this and hooks in via {@link onSetup} /
 * {@link onPaired} / {@link afterCommand} / {@link onShutdown}. The socket keeps
 * the Nest application context alive.
 */
export abstract class BaseAgentService {
    protected readonly logger: Logger
    /** Live once {@link run} has been called — hooks may use it freely. */
    protected socket!: Socket
    /** Console + browser log sink; live once {@link run} has been called. */
    protected sendLog!: (line: string, level?: "info" | "warn" | "error") => void
    /** Serialises browser-issued work (commands, rag index/ask) in arrival order. */
    protected queue: Promise<void> = Promise.resolve()

    constructor(
        @Inject(AGENT_META) protected readonly meta: AgentMeta,
        protected readonly deviceService: DeviceService,
    ) {
        this.logger = new Logger(meta.label)
    }

    /** Register capability event handlers on {@link socket} (called once, after the common handlers). */
    protected onSetup(): void {}
    /** Start capability loops after a successful pair (e.g. resource / ollama polling). */
    protected onPaired(): void {}
    /** Run after a browser command completes (docker/k8s report resources; default no-op). */
    protected afterCommand(): void {}
    /** Clear capability timers on shutdown. */
    protected onShutdown(): void {}

    /** Run one browser-issued command locally, streaming its output back over the socket. */
    private runBrowserCommand(command: string): Promise<void> {
        return new Promise((resolve) => {
            this.socket.emit(EVENT.commandOutput,
                {
                    output: `$ ${command}\n` 
                })
            const child = spawn(command,
                {
                    shell: true, windowsHide: true 
                })
            const forward = (chunk: Buffer): void => {
                this.socket.emit(EVENT.commandOutput,
                    {
                        output: chunk.toString() 
                    })
            }
            child.stdout.on("data",
                forward)
            child.stderr.on("data",
                forward)
            child.on("error",
                (error) => {
                    this.socket.emit(EVENT.commandOutput,
                        {
                            output: `\n[agent] failed to run: ${error.message}\n` 
                        })
                })
            child.on("close",
                (code) => {
                    if (code && code !== 0) {
                        this.socket.emit(EVENT.commandOutput,
                            {
                                output: `\n[exit ${code}]\n` 
                            })
                    }
                    resolve()
                })
        })
    }

    /** Enqueue work so browser-issued events run one at a time, in arrival order. */
    protected enqueue(work: () => Promise<void>): void {
        this.queue = this.queue.then(work).catch((error) => {
            this.logger.warn(`queued task failed: ${(error as Error).message}`)
        })
    }

    /** The long-running relay for a `run` invocation. Returns after wiring up the socket. */
    run(pairingCode: string, server: string): void {
        this.logger.log(`connecting to ${server}${NAMESPACE} …`)
        const socket: Socket = io(`${server}${NAMESPACE}`,
            {
                transports: ["websocket",
                    "polling"],
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
            })
        this.socket = socket

        // log to the console AND stream the line to the browser (relayed by the gateway).
        this.sendLog = (line: string, level: "info" | "warn" | "error" = "info"): void => {
            if (level === "warn") {
                this.logger.warn(line)
            } else if (level === "error") {
                this.logger.error(line)
            } else {
                this.logger.log(line)
            }
            socket.emit(EVENT.log,
                {
                    line, level, t: Date.now() 
                })
        }

        const pair = (): void => {
            socket.emit(EVENT.pair,
                {
                    pairingCode 
                },
                (ack: PairAck) => {
                    if (!ack || !ack.sessionId) {
                        this.logger.error(`pairing failed${ack?.error ? `: ${ack.error}` : " — check the code / server URL"}.`)
                        process.exit(1)
                    }
                    this.sendLog(`paired OK  playground=${ack.playgroundSlug ?? "?"}  step=${(ack.currentStepIndex ?? 0) + 1}`)
                    // report this machine's hardware ONCE (best-effort GPU) so the UI can show it.
                    void this.deviceService.collect().then((info) => {
                        socket.emit(EVENT.deviceInfo,
                            info)
                        this.sendLog(`device: ${info.platform} ${info.arch} · ${info.cpuModel} (${info.cpuCores}) · ${Math.round(info.totalMemBytes / 1e9)}GB${info.gpu ? ` · ${info.gpu}` : ""}`)
                    })
                    this.sendLog(this.meta.readyMessage)
                    this.onPaired()
                })
        }

        socket.on("connect",
            pair)
        socket.on("connect_error",
            (error) => this.sendLog(`connection error: ${error.message} (retrying…)`,
                "warn"))
        socket.on("disconnect",
            (reason) => this.sendLog(`disconnected: ${reason} (retrying…)`,
                "warn"))

        socket.on(EVENT.commandRun,
            (payload: { command?: string }) => {
                const command = payload?.command
                if (!command) {
                    return
                }
                this.enqueue(async () => {
                    await this.runBrowserCommand(command)
                    this.afterCommand()
                })
            })

        socket.on(EVENT.ping,
            (payload: { t?: number }) => {
                socket.emit(EVENT.pong,
                    {
                        t: payload?.t 
                    })
            })

        this.onSetup()

        const shutdown = (): void => {
            this.logger.log("shutting down.")
            this.onShutdown()
            socket.close()
            process.exit(0)
        }
        process.on("SIGINT",
            shutdown)
        process.on("SIGTERM",
            shutdown)
    }
}
