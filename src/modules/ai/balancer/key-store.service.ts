import {
    Injectable,
} from "@nestjs/common"
import {
    ModelProvider,
} from "@modules/databases"
import {
    MountFilesystemService,
} from "@modules/filesystem"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    KeyStatus,
} from "./enums"
import type {
    KeyState,
    ProviderKeyFile,
} from "./types"
import {
    AiModelCatalogService,
} from "./ai-model-catalog.service"

/**
 * In-memory store of API keys keyed by provider.
 *
 * Lazily (on first {@link KeyStoreService.ensureLoaded}) reads the enabled
 * model catalog from the `ai_models` table via {@link AiModelCatalogService},
 * de-duplicates by `(provider, keysFilePath)`, and asks the mount service to
 * parse the newline-separated key file for each provider. {@link KeyHealthService}
 * mutates `status` / `failCount` at runtime; {@link KeyRotatorService} picks an
 * active key per request.
 *
 * Loading is lazy (not `onModuleInit`) because the catalog is seeded into the
 * DB by `InitModule`, which may run after this provider is constructed — the
 * first AI call (well after boot) triggers the load.
 *
 * The mount file format is plain text — one API key per line (empty lines and
 * `#`-comment lines are stripped). Missing or empty file → empty pool (no crash).
 *
 * @example
 * await keyStore.ensureLoaded()
 * const pool = keyStore.getPool(ModelProvider.OpenAI)
 * const active = pool.filter((key) => key.status === KeyStatus.Active)
 */
@Injectable()
export class KeyStoreService {
    /** Provider → ordered list of key states (stable order for round-robin). */
    private readonly pool = new Map<ModelProvider, Array<KeyState>>()
    /** Provider → mount file path actually loaded (for logs / health snapshot). */
    private readonly pathByProvider = new Map<ModelProvider, string>()
    /** Whether {@link reloadAll} has completed at least once. */
    private loaded = false

    constructor(
        private readonly mountFilesystemService: MountFilesystemService,
        private readonly aiModelCatalogService: AiModelCatalogService,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Load the pools once. No-op after the first successful load — call
     * {@link reloadAll} directly to force a refresh (e.g. after a reseed).
     */
    async ensureLoaded(): Promise<void> {
        if (this.loaded) {
            return
        }
        await this.reloadAll()
    }

    /**
     * Reload every enabled provider's key pool from its mount file, driven by
     * the DB catalog. Idempotent — safe to call again at runtime.
     */
    async reloadAll(): Promise<void> {
        // fetch enabled model rows from the DB catalog (cached in-memory)
        const models = await this.aiModelCatalogService.enabledModels()

        // de-duplicate by (provider, keysFilePath) — many models share one pool
        const work = this.dedupeProviderFiles(models)

        // reload each provider
        for (const item of work) {
            this.reloadProvider(item)
        }

        this.loaded = true
    }

    /**
     * Reload a single provider's pool by asking {@link MountFilesystemService}
     * to parse the corresponding mount file.
     *
     * @param params - provider + mount file path pair (path is recorded for logs / snapshot only;
     *                 the actual file is resolved inside `mountFilesystemService`)
     */
    reloadProvider(params: ProviderKeyFile): void {
        const {
            provider,
            keysFilePath,
        } = params

        // delegate parsing to mount service
        const keys = this.readKeys(provider)

        // hydrate fresh KeyState entries (existing health info is discarded — caller
        // can re-run health check after reload)
        const states: Array<KeyState> = keys.map((value) => ({
            value,
            provider,
            status: KeyStatus.Active,
            keySuffix: value.slice(-4),
            failCount: 0,
            lastUsedAt: null,
            lastHealthCheckAt: null,
            disabledAt: null,
        }))

        // overwrite in-memory pool atomically
        this.pool.set(
            provider,
            states,
        )
        this.pathByProvider.set(
            provider,
            keysFilePath,
        )

        // log reload event
        this.winstonService.log(
            WinstonLog.AiBalancerKeysReloaded,
            {
                provider,
                keysCount: states.length,
                keysFilePath,
            },
        )
    }

    /**
     * Live reference to the per-provider key list. Callers (rotator, health)
     * mutate `status`, `failCount`, etc. on entries — the store does not
     * defensively copy because those services own that mutation.
     *
     * @param provider - target provider
     * @returns Mutable pool array (empty when provider unknown / not yet loaded)
     */
    getPool(provider: ModelProvider): Array<KeyState> {
        return this.pool.get(provider) ?? []
    }

    /**
     * Read-only access for snapshots / admin UI.
     *
     * @returns List of every loaded provider with its mount path
     */
    listProviders(): Array<ProviderKeyFile> {
        return Array.from(this.pathByProvider.entries()).map(
            ([
                provider,
                keysFilePath,
            ]) => ({
                provider,
                keysFilePath,
            }),
        )
    }

    /**
     * Collapse the model list to one entry per `(provider, keysFilePath)`
     * pair so the same pool file is not re-read multiple times.
     */
    private dedupeProviderFiles(models: Array<ProviderKeyFile>): Array<ProviderKeyFile> {
        const seen = new Set<string>()
        const work: Array<ProviderKeyFile> = []
        for (const model of models) {
            // composite key for the dedupe set
            const compositeKey = `${model.provider}::${model.keysFilePath}`
            if (seen.has(compositeKey)) {
                continue
            }
            seen.add(compositeKey)
            work.push({
                provider: model.provider,
                keysFilePath: model.keysFilePath,
            })
        }
        return work
    }

    /**
     * Delegate key parsing to {@link MountFilesystemService} based on provider.
     *
     * Missing / empty / unsupported provider all collapse to `[]` (the
     * balancer will then surface `NoActiveBalancerKeyException` on the
     * first `acquire` for that provider).
     */
    private readKeys(provider: ModelProvider): Array<string> {
        switch (provider) {
        case ModelProvider.OpenAI:
            return this.mountFilesystemService.openAiApiKeys()
        case ModelProvider.Gemini:
            return this.mountFilesystemService.geminiApiKeys()
        case ModelProvider.Local:
            // self-hosted OpenAI-compatible endpoint — the "key" is the bearer
            // token the Caddy gate validates (or a placeholder for a gate-less
            // local Ollama). Keeps the provider eligible so Auto tries it first.
            return this.mountFilesystemService.localApiKeys()
        default:
            return []
        }
    }
}
