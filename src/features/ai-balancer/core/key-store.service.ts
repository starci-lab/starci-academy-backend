import {
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    ModelProvider,
} from "@modules/databases"
import {
    MountFilesystemService,
} from "@modules/filesystem"
import type {
    AppConfigAiModel,
} from "@modules/filesystem"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    KeyStatus,
} from "../enums"
import type {
    KeyState,
    ProviderKeyFile,
} from "../types"

/**
 * In-memory store of API keys keyed by provider.
 *
 * On boot, reads the AI catalog from `MountFilesystemService.appConfig().ai.models`,
 * de-duplicates by `(provider, keysFilePath)`, and asks the mount service to
 * parse the newline-separated key file for each provider. {@link KeyHealthService}
 * mutates `status` / `failCount` at runtime; {@link KeyRotatorService} picks
 * an active key per request.
 *
 * The mount file format is plain text — one API key per line (empty lines
 * and `#`-comment lines are stripped):
 *
 * ```
 * # sample header comment
 * sk-aaa
 * sk-bbb
 * sk-ccc
 * ```
 *
 * Missing or empty file → empty pool (boot does not crash).
 *
 * @example
 * const pool = keyStore.getPool(ModelProvider.OpenAI)
 * const active = pool.filter((key) => key.status === KeyStatus.Active)
 */
@Injectable()
export class KeyStoreService implements OnModuleInit {
    /** Provider → ordered list of key states (stable order for round-robin). */
    private readonly pool = new Map<ModelProvider, Array<KeyState>>()
    /** Provider → mount file path actually loaded (for logs / health snapshot). */
    private readonly pathByProvider = new Map<ModelProvider, string>()

    constructor(
        private readonly mountFilesystemService: MountFilesystemService,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Lifecycle hook — reloads every provider's pool from the mount files
     * when the module bootstraps.
     */
    onModuleInit(): void {
        this.reloadAll()
    }

    /**
     * Reload every enabled provider's key pool from its mount file.
     *
     * Idempotent — safe to call again at runtime (e.g. after `app.yaml` is
     * edited and the process is signalled to refresh).
     */
    reloadAll(): void {
        // fetch enabled model rows from the mounted catalog (app.yaml)
        const {
            models,
        } = this.mountFilesystemService.appConfig().ai
        const enabled = models.filter((model) => model.enabled)

        // de-duplicate by (provider, keysFilePath) — many models share one pool
        const work = this.dedupeProviderFiles(enabled)

        // reload each provider
        for (const item of work) {
            this.reloadProvider(item)
        }
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
     * @returns Mutable pool array (empty when provider unknown)
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
    private dedupeProviderFiles(models: Array<AppConfigAiModel>): Array<ProviderKeyFile> {
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
        case ModelProvider.Claude:
            return this.mountFilesystemService.claudeApiKeys()
        default:
            return []
        }
    }
}
