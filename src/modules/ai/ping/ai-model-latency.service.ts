import {
    Injectable,
    OnModuleDestroy,
    OnModuleInit,
} from "@nestjs/common"
import {
    AiModelLatencyCacheService,
} from "@modules/cache"
import {
    AiModelCategory,
    ModelProvider,
} from "@modules/databases"
import {
    EventEmitterService,
    EventName,
} from "@modules/event"
import type {
    AiModelHealthSnapshot,
} from "@modules/event"
import {
    envConfig,
} from "@modules/env"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    AiModelCatalogService,
    UseApiService,
} from "../balancer"
import type {
    AiModelEntity,
} from "@modules/databases"

@Injectable()
/**
 * Per-MODEL latency probe scheduler.
 *
 * Mirrors the staggered lifecycle of {@link AbstractProviderPingService} but
 * probes MODELS (not keys): every cycle it runs a real 1-token completion
 * against each enabled model (filtered by {@link envConfig().ai.latencyProbe}
 * scope), measures latency + up/down, writes the snapshot to
 * {@link AiModelLatencyCacheService}, then emits {@link EventName.AiModelHealthUpdated}
 * with the FULL cycle snapshot so the Socket.IO gateway can broadcast it.
 *
 * A SEPARATE layer from the per-provider key ping -- this is UI/status only and
 * never feeds balancer key eligibility. Every step is wrapped in try/catch so a
 * failing probe can never crash the scheduler.
 */
export class AiModelLatencyService implements OnModuleInit, OnModuleDestroy {
    /** Handle for the recurring cycle timer -- cleared on shutdown. */
    private cycleIntervalHandle: NodeJS.Timeout | null = null
    /** Pending per-model stagger timers for the active cycle. */
    private staggerHandles: Array<NodeJS.Timeout> = []
    /** Whether a cycle is currently scheduling or awaiting stagger callbacks. */
    private cycleInProgress = false

    constructor(
        private readonly useApiService: UseApiService,
        private readonly aiModelCatalogService: AiModelCatalogService,
        private readonly aiModelLatencyCacheService: AiModelLatencyCacheService,
        private readonly eventEmitterService: EventEmitterService,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Arm the recurring probe cycle (gated by `ai.latencyProbe.enabled`).
     */
    onModuleInit(): void {
        // read the gate + cadence at boot; disabled -> scheduler stays idle
        const {
            enabled,
            cycleIntervalMs,
        } = envConfig().ai.latencyProbe

        if (!enabled) {
            return
        }

        // run one cycle right away so the cache/status page is populated on boot
        void this.runCycle()

        // then re-trigger a full cycle every `cycleIntervalMs`
        this.cycleIntervalHandle = setInterval(
            () => {
                void this.runCycle()
            },
            cycleIntervalMs,
        )
    }

    /**
     * Clear cycle + stagger timers so Jest / graceful shutdown do not leak.
     */
    onModuleDestroy(): void {
        // stop the recurring cycle
        if (this.cycleIntervalHandle) {
            clearInterval(this.cycleIntervalHandle)
            this.cycleIntervalHandle = null
        }
        // cancel any pending staggered model probes
        this.clearStaggerHandles()
        this.cycleInProgress = false
    }

    /**
     * One staggered pass over every in-scope enabled model.
     */
    async runCycle(): Promise<void> {
        // never overlap cycles -- if the previous one is still draining its
        // stagger timers, skip this tick
        if (this.cycleInProgress) {
            return
        }

        try {
            // resolve the model set for this cycle (scope-filtered); empty -> nothing to do
            const models = await this.listModelsInScope()
            if (models.length === 0) {
                return
            }

            // mark the cycle active and clear any leftover timers before scheduling
            this.cycleInProgress = true
            this.clearStaggerHandles()

            const {
                staggerMs,
            } = envConfig().ai.latencyProbe

            // schedule each model probe offset by indexxstaggerMs so we don't hit
            // every provider at once; the LAST one flips `cycleInProgress` off and
            // emits the full snapshot
            for (let index = 0; index < models.length; index++) {
                const model = models[index]
                const isLast = index === models.length - 1
                const handle = setTimeout(
                    () => {
                        void this.probeScheduledModel(
                            model,
                            isLast,
                        )
                    },
                    index * staggerMs,
                )
                this.staggerHandles.push(handle)
            }
        } catch (error) {
            // listing models failed (DB blip) -> log + release the lock so the next
            // tick can retry; never let it bubble out of the scheduler
            this.winstonService.log(WinstonLog.AiModelLatencyFailed,
                {
                    op: "ai.latency.cycle-start-failed",
                    error: this.toMessage(error),
                })
            this.cycleInProgress = false
        }
    }

    /**
     * Probe one scheduled model, write its snapshot, and on the last model of
     * the cycle broadcast the full snapshot.
     * @param model - The catalog row being probed.
     * @param isLast - When true, ends the cycle and emits the snapshot.
     */
    private async probeScheduledModel(
        model: AiModelEntity,
        isLast: boolean,
    ): Promise<void> {
        try {
            // read the per-probe timeout fresh (env may be re-read each call)
            const {
                timeoutMs,
            } = envConfig().ai.latencyProbe

            // run the real 1-token probe against this exact model
            const result = await this.useApiService.probeModel({
                provider: model.provider,
                model: model.name,
                timeoutMs,
            })

            // persist the outcome (overwrites the previous snapshot for this model)
            await this.aiModelLatencyCacheService.recordModelLatency({
                model: model.name,
                provider: model.provider,
                ok: result.ok,
                latencyMs: result.latencyMs,
                errorMessage: result.errorMessage,
            })

            // surface WHY a model is down -- the probe reason is otherwise only in the
            // cache/tooltip, never logged. Warn = visible; 60s cadence = low noise.
            if (!result.ok) {
                this.winstonService.log(WinstonLog.AiModelLatencyFailed,
                    {
                        op: "ai.latency.probe-down",
                        error: result.errorMessage ?? "unknown error",
                        meta: {
                            provider: model.provider,
                            model: model.name,
                        },
                    })
            }
        } catch (error) {
            this.winstonService.log(WinstonLog.AiModelLatencyFailed,
                {
                    op: "ai.latency.probe-failed",
                    error: this.toMessage(error),
                    meta: {
                        model: model.name,
                    },
                })
            await this.safeRecordDown(model)
        } finally {
            // the last model of the cycle closes it and broadcasts the snapshot
            if (isLast) {
                this.cycleInProgress = false
                await this.emitSnapshot()
            }
        }
    }

    /**
     * Build the full snapshot from cache + the enabled catalog (for the category
     * each model belongs to) and emit it as {@link EventName.AiModelHealthUpdated}.
     */
    private async emitSnapshot(): Promise<void> {
        try {
            // pull the latest per-model snapshots written this cycle
            const latencyMap = await this.aiModelLatencyCacheService.getAll()
            // category lives in the catalog, not the latency cache -- index enabled
            // models by name so we can attach it to each snapshot
            const enabled = await this.aiModelCatalogService.enabledModels()
            const categoryByName = new Map<string, AiModelCategory>(
                enabled.map((model) => [
                    model.name,
                    model.category,
                ]),
            )

            // shape the public-safe snapshot array (only models still in the catalog)
            const models: Array<AiModelHealthSnapshot> = Object.entries(latencyMap)
                .filter(([
                    name,
                ]) => categoryByName.has(name))
                .map(([
                    name,
                    entry,
                ]) => ({
                    name,
                    provider: entry.provider,
                    // safe: filtered above to names present in the category map
                    category: categoryByName.get(name) as AiModelCategory,
                    ok: entry.ok,
                    latencyMs: entry.latencyMs,
                    checkedAt: entry.checkedAt,
                    errorMessage: entry.errorMessage,
                }))

            // fan out to the gateway (local) + other pods (NATS) for realtime UI
            await this.eventEmitterService.emit({
                event: EventName.AiModelHealthUpdated,
                payload: {
                    models,
                },
            })
        } catch (error) {
            // emitting/reading the snapshot failed -> log only; the cache still holds
            // the fresh data for the next query/poll
            this.winstonService.log(WinstonLog.AiModelLatencyFailed,
                {
                    op: "ai.latency.snapshot-emit-failed",
                    error: this.toMessage(error),
                })
        }
    }

    /**
     * Enabled models filtered by the configured scope. `all` = every enabled
     * model; `freeLocal` = only `Local`-provider or `Free`-category models.
     * @returns The catalog rows to probe this cycle.
     */
    private async listModelsInScope(): Promise<Array<AiModelEntity>> {
        // every enabled model, highest priority first
        const models = await this.aiModelCatalogService.enabledModels()
        // read the scope knob; only `freeLocal` narrows the set, anything else = all
        const {
            scope,
        } = envConfig().ai.latencyProbe
        if (scope !== "freeLocal") {
            return models
        }
        // free lane only: self-hosted Local provider OR Free-tier models
        return models.filter(
            (model) => model.provider === ModelProvider.Local
                || model.category === AiModelCategory.Low,
        )
    }

    /**
     * Record a model down without throwing -- used when the probe itself threw.
     * @param model - The catalog row to mark down.
     */
    private async safeRecordDown(model: AiModelEntity): Promise<void> {
        try {
            // best-effort: a down snapshot so the status page still shows this model
            await this.aiModelLatencyCacheService.recordModelLatency({
                model: model.name,
                provider: model.provider,
                ok: false,
                latencyMs: 0,
                errorMessage: "Probe threw before completing",
            })
        } catch (error) {
            // even the cache write failed -> log only; nothing else we can do here
            this.winstonService.log(WinstonLog.AiModelLatencyFailed,
                {
                    op: "ai.latency.down-record-failed",
                    error: this.toMessage(error),
                    meta: {
                        model: model.name,
                    },
                })
        }
    }

    /**
     * Cancel every pending stagger timer from the current cycle.
     */
    private clearStaggerHandles(): void {
        // clear each scheduled-but-not-yet-fired probe timer
        for (const handle of this.staggerHandles) {
            clearTimeout(handle)
        }
        this.staggerHandles = []
    }

    /**
     * Normalize an unknown caught value into a short message for logging.
     * @param error - The caught value.
     * @returns A string message.
     */
    private toMessage(error: unknown): string {
        // keep the type guard at the boundary so log sites stay clean
        return error instanceof Error ? error.message : String(error)
    }
}
