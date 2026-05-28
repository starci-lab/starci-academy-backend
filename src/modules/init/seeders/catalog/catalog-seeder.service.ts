import {
    Injectable,
} from "@nestjs/common"
import {
    getAppConfig,
    MountStorageService,
} from "@modules/filesystem"
import {
    AiModelCatalogService,
    KeyStoreService,
} from "@modules/ai"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    isAiModelsCatalogSeederEnabled,
    isSubscriptionsCatalogSeederEnabled,
} from "../shared/scope"
import {
    AiModelCatalogParserService,
    SubscriptionCatalogParserService,
} from "./parsers"
import {
    AiModelInsertService,
} from "./inserts"

/**
 * Seeds the catalog from `.mount/data/*`:
 *
 * - **AI models** → upserted into the `ai_models` table (the runtime source of
 *   truth read by `KeyStoreService` + `UseApiService`). After upsert the query
 *   cache is invalidated and the key pools reloaded.
 * - **Subscriptions** → merged into the runtime `MountStorageService.appConfig`
 *   (tiers are still served from `appConfig().subscriptions`).
 */
@Injectable()
export class CatalogSeederService {
    constructor(
        private readonly aiModelCatalogParserService: AiModelCatalogParserService,
        private readonly subscriptionCatalogParserService: SubscriptionCatalogParserService,
        private readonly aiModelInsertService: AiModelInsertService,
        private readonly aiModelCatalogService: AiModelCatalogService,
        private readonly mountStorageService: MountStorageService,
        private readonly keyStoreService: KeyStoreService,
        private readonly winstonService: WinstonService,
    ) {}

    /** Upsert the DB model catalog + merge subscription tiers into mount storage. */
    async seed(): Promise<void> {
        const aiModelsEnabled = isAiModelsCatalogSeederEnabled()
        const subscriptionsEnabled = isSubscriptionsCatalogSeederEnabled()
        if (!aiModelsEnabled && !subscriptionsEnabled) {
            return
        }

        let modelsSynced = 0
        let tiersSynced = 0

        if (aiModelsEnabled) {
            const parsed =
                await this.aiModelCatalogParserService.parseManyWithTranslations()
            if (parsed.length > 0) {
                await this.aiModelInsertService.upsertMany(parsed)
                modelsSynced = parsed.length
                // drop the stale (pre-seed) cache, then rehydrate key pools from DB
                await this.aiModelCatalogService.invalidate()
                await this.keyStoreService.reloadAll()
            }
        }

        if (subscriptionsEnabled) {
            const tiers = await this.subscriptionCatalogParserService.parseMany()
            if (tiers.length > 0) {
                const base = getAppConfig()
                base.subscriptions = {
                    tiers,
                }
                this.mountStorageService.applyAppConfig(base)
                tiersSynced = tiers.length
            }
        }

        if (aiModelsEnabled) {
            this.winstonService.log(
                WinstonLog.SeederFinished,
                {
                    seeder: "ai-models",
                    upserted: modelsSynced,
                },
            )
        }
        if (subscriptionsEnabled) {
            this.winstonService.log(
                WinstonLog.SeederFinished,
                {
                    seeder: "subscriptions",
                    upserted: tiersSynced,
                },
            )
        }
    }
}
