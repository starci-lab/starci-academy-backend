import {
    AiPingCacheService,
} from "@modules/cache"
import {
    ModelProvider,
} from "@modules/databases"
import {
    EventEmitterService,
    EventName,
} from "@modules/event"
import {
    envConfig,
} from "@modules/env"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import type {
    OnModuleDestroy,
    OnModuleInit,
} from "@nestjs/common"
import type {
    PingKeyResult,
} from "../types"
import {
    dedupeNonEmptyKeys,
    toKeySuffix,
} from "../utils"

/**
 * Shared staggered sweep scheduler for one {@link ModelProvider} ping service.
 *
 * Each concrete `*PingService` runs its **own** cycle — keys of different
 * providers never block each other.
 */
export abstract class AbstractProviderPingService implements OnModuleInit, OnModuleDestroy {
    /** Handle for the recurring cycle timer — cleared on shutdown. */
    private cycleIntervalHandle: NodeJS.Timeout | null = null
    /** Pending per-key stagger timers for the active sweep. */
    private staggerHandles: Array<NodeJS.Timeout> = []
    /** Whether a sweep is currently scheduling or awaiting stagger callbacks. */
    private sweepInProgress = false

    /** Provider identity — used in logs and {@link AiPingService.pingKey} routing. */
    protected abstract readonly provider: ModelProvider

    constructor(
        protected readonly eventEmitterService: EventEmitterService,
        protected readonly winstonService: WinstonService,
        protected readonly aiPingCacheService: AiPingCacheService,
    ) { }

    /**
     * Zero-token ping for one API key — implemented by each provider service.
     * @param key - Raw API key value.
     * @returns Structured ping outcome.
     */
    protected abstract executePing(key: string): Promise<PingKeyResult>

    /**
     * Mount-file keys belonging to this provider only.
     * @returns De-duplicated non-empty keys in stable file order.
     */
    protected abstract listMountKeys(): Array<string>

    /**
     * Public ping entry — used by {@link AiPingService} and the AI Balancer.
     * @param key - Raw API key value.
     * @returns Structured ping outcome.
     */
    async ping(key: string): Promise<PingKeyResult> {
        const result = await this.executePing(key)
        await this.aiPingCacheService.recordPingKeyStatus({
            provider: this.provider,
            key,
            success: result.success,
        })
        return result
    }

    /**
     * Arm this provider's recurring key sweep scheduler.
     */
    onModuleInit(): void {
        const {
            enabled,
            cycleIntervalMs,
        } = envConfig().ai.ping

        if (!enabled) {
            return
        }

        void this.runSweep()

        this.cycleIntervalHandle = setInterval(
            () => {
                void this.runSweep()
            },
            cycleIntervalMs,
        )
    }

    /**
     * Clear cycle + stagger timers so Jest / graceful shutdown do not leak.
     */
    onModuleDestroy(): void {
        if (this.cycleIntervalHandle) {
            clearInterval(this.cycleIntervalHandle)
            this.cycleIntervalHandle = null
        }
        this.clearStaggerHandles()
        this.sweepInProgress = false
    }

    /**
     * Expose mount keys for callers that need a provider-scoped list.
     * @returns De-duplicated keys for {@link provider}.
     */
    listKeys(): Array<string> {
        return dedupeNonEmptyKeys(this.listMountKeys())
    }

    /**
     * One staggered pass over this provider's mount keys.
     */
    async runSweep(): Promise<void> {
        if (this.sweepInProgress) {
            return
        }

        const keys = this.listKeys()
        if (keys.length === 0) {
            return
        }

        this.sweepInProgress = true
        this.clearStaggerHandles()

        const {
            keyStaggerMs,
        } = envConfig().ai.ping

        for (let index = 0; index < keys.length; index++) {
            const key = keys[index]
            const isLast = index === keys.length - 1
            const handle = setTimeout(
                () => {
                    void this.pingScheduledKey(
                        key,
                        isLast,
                    )
                },
                index * keyStaggerMs,
            )
            this.staggerHandles.push(handle)
        }
    }

    /**
     * Ping one scheduled key, log, and emit a local heartbeat on success.
     * @param key - Raw API key value.
     * @param isLast - When true, marks the sweep as finished.
     */
    private async pingScheduledKey(
        key: string,
        isLast: boolean,
    ): Promise<void> {
        try {
            const result = await this.ping(key)

            this.winstonService.log(
                WinstonLog.AiPingResult,
                {
                    provider: this.provider,
                    keySuffix: toKeySuffix(key),
                    success: result.success,
                    error: result.errorMessage ?? undefined,
                },
            )

            if (result.success) {
                await this.eventEmitterService.emit({
                    event: EventName.Ping,
                    payload: {
                        status: "ok",
                    },
                    options: {
                        useLocal: true,
                        useNats: false,
                    },
                })
            }
        } finally {
            if (isLast) {
                this.sweepInProgress = false
            }
        }
    }

    /**
     * Cancel every pending stagger timer from the current sweep.
     */
    private clearStaggerHandles(): void {
        for (const handle of this.staggerHandles) {
            clearTimeout(handle)
        }
        this.staggerHandles = []
    }
}
