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

@Injectable()
/**
 * In-memory store of API keys keyed by provider.
 *
 * Lazily (on first {@link KeyStoreService.ensureLoaded}) reads the enabled
 * model catalog from the `ai_models` table via {@link AiModelCatalogService}
 * and parses each model's own `keysFilePath` (one `.key` file per model),
 * merging the keys of all models that share a provider into that provider's
 * pool. Every key remembers which file it came from. {@link KeyRotatorService}
 * picks an active key per request; the ping cache flags unhealthy keys.
 *
 * Loading is lazy (not `onModuleInit`) because the catalog is seeded into the
 * DB by `InitModule`, which may run after this provider is constructed -- the
 * first AI call (well after boot) triggers the load.
 *
 * The mount file format is plain text -- one API key per line (empty lines and
 * `#`-comment lines are stripped). Missing or empty file -> empty pool (no crash).
 *
 * @example
 * await keyStore.ensureLoaded()
 * const pool = keyStore.getPool(ModelProvider.OpenAI)
 * const active = pool.filter((key) => key.status === KeyStatus.Active)
 */
export class KeyStoreService {
    /** Provider -> ordered list of key states (stable order for round-robin). */
    private readonly pool = new Map<ModelProvider, Array<KeyState>>()
    /** Provider -> mount file path actually loaded (for logs / health snapshot). */
    private readonly pathByProvider = new Map<ModelProvider, string>()
    /** Whether {@link reloadAll} has completed at least once. */
    private loaded = false

    constructor(
        private readonly mountFilesystemService: MountFilesystemService,
        private readonly aiModelCatalogService: AiModelCatalogService,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Load the pools once. No-op after the first successful load -- call
     * {@link reloadAll} directly to force a refresh (e.g. after a reseed).
     */
    async ensureLoaded(): Promise<void> {
        if (this.loaded) {
            return
        }
        await this.reloadAll()
    }

    /**
     * Reload every enabled provider's key pool, driven by the DB catalog. Each
     * model declares its own `keysFilePath` (one `.key` file per model); a
     * provider's pool is the merged, de-duplicated union of every file its
     * enabled models point at. Every key remembers which file it came from so
     * the health snapshot can report per model. Idempotent.
     */
    async reloadAll(): Promise<void> {
        // fetch enabled model rows from the DB catalog (cached in-memory)
        const models = await this.aiModelCatalogService.enabledModels()

        // group every enabled model's key file by provider (a provider may expose
        // several models pulling from different files -> merge into one pool)
        const pathsByProvider = new Map<ModelProvider, Set<string>>()
        for (const model of models) {
            const paths = pathsByProvider.get(model.provider) ?? new Set<string>()
            if (model.keysFilePath) {
                paths.add(model.keysFilePath)
            }
            pathsByProvider.set(
                model.provider,
                paths,
            )
        }

        for (const [
            provider,
            paths,
        ] of pathsByProvider) {
            this.reloadProvider({
                provider,
                paths: [
                    ...paths,
                ],
            })
        }

        this.loaded = true
    }

    /**
     * Reload one provider's pool by reading each catalog-declared key file
     * ({@link AiModelEntity.keysFilePath}) and merging the keys. Every key is
     * tagged with its source file. When no catalog file resolves to a key (path
     * missing / empty), falls back to the legacy per-provider pool getter so
     * existing deployments keep working.
     *
     * @param params - provider + the model `keysFilePath`s to load for it
     */
    private reloadProvider(params: { provider: ModelProvider, paths: Array<string> }): void {
        const {
            provider,
            paths,
        } = params

        // read every declared key file, tag each key with the file it came from,
        // de-duplicate (the same key may appear in two models' files)
        const tagged: Array<{ value: string, keysFilePath: string }> = []
        const seen = new Set<string>()
        for (const path of paths) {
            for (const value of this.mountFilesystemService.readKeysFile(path)) {
                if (seen.has(value)) {
                    continue
                }
                seen.add(value)
                tagged.push({
                    value,
                    keysFilePath: path,
                })
            }
        }

        // label recorded for logs / snapshot (the configured file path(s))
        const pathLabel = paths.join(", ") || "(legacy)"

        // soft fallback: nothing resolved from the catalog files -> legacy getter
        let entries = tagged
        if (entries.length === 0) {
            entries = this.readLegacyKeys(provider).map((value) => ({
                value,
                keysFilePath: pathLabel,
            }))
        }

        // hydrate fresh KeyState entries (existing health info is discarded -- caller
        // can re-run health check after reload)
        const states: Array<KeyState> = entries.map(({
            value,
            keysFilePath,
        }) => ({
            value,
            provider,
            keysFilePath,
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
            pathLabel,
        )

        // log reload event
        this.winstonService.log(
            WinstonLog.AiBalancerKeysReloaded,
            {
                provider,
                keysCount: states.length,
                keysFilePath: pathLabel,
            },
        )
    }

    /**
     * Live reference to the per-provider key list. Callers (rotator, health)
     * mutate `status`, `failCount`, etc. on entries -- the store does not
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
     * Legacy per-provider pool getter -- the fallback used when a model's
     * declared `keysFilePath` resolves to no key (file missing / empty), so
     * deployments still on the old single-pool-file layout keep working.
     *
     * Missing / empty / unsupported provider all collapse to `[]` (the
     * balancer will then surface `NoActiveBalancerKeyException` on the
     * first `acquire` for that provider).
     */
    private readLegacyKeys(provider: ModelProvider): Array<string> {
        switch (provider) {
        case ModelProvider.OpenAI:
            return this.mountFilesystemService.openAiApiKeys()
        case ModelProvider.Gemini:
            return this.mountFilesystemService.geminiApiKeys()
        case ModelProvider.Local:
            // self-hosted OpenAI-compatible endpoint -- the "key" is the bearer
            // token the Caddy gate validates (or a placeholder for a gate-less
            // local Ollama). Keeps the provider eligible so Auto tries it first.
            return this.mountFilesystemService.localApiKeys()
        case ModelProvider.OpenRouter:
            // OpenRouter gateway -- pooled API keys (Bearer) from the mount file.
            return this.mountFilesystemService.openRouterApiKeys()
        case ModelProvider.Anthropic:
            // native Anthropic Claude API -- pooled keys from the mount file.
            return this.mountFilesystemService.anthropicApiKeys()
        default:
            return []
        }
    }
}
