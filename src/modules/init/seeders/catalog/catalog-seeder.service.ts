import {
    Injectable,
    Optional,
} from "@nestjs/common"
import {
    MountStorageService,
} from "@modules/filesystem/mount-storage.service"
import {
    getAppConfig,
} from "@modules/filesystem/utils/mount-secrets"
import {
    AiModelCatalogService,
} from "@modules/ai/balancer/ai-model-catalog.service"
import {
    KeyStoreService,
} from "@modules/ai/balancer/key-store.service"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    SeedScopeService,
} from "../../scope/seed-scope.service"
import {
    AiModelCatalogParserService,
} from "./parsers/ai-model-catalog.parser"
import {
    SubscriptionCatalogParserService,
} from "./parsers/subscription-catalog.parser"
import {
    AiModelInsertService,
} from "./inserts/ai-model-insert.service"
import {
    LearnerPlanCatalogParserService,
} from "./parsers/learner-plan-catalog.parser"

@Injectable()
/**
 * Seeds the catalog from `.mount/data/*`:
 *
 * - **AI models** -> upserted into the `ai_models` table (the runtime source of
 *   truth read by `KeyStoreService` + `UseApiService`). After upsert the query
 *   cache is invalidated and the key pools reloaded.
 * - **Subscriptions** -> merged into the runtime `MountStorageService.appConfig`
 *   (tiers are still served from `appConfig().subscriptions`).
 */
export class CatalogSeederService {
    constructor(
        private readonly aiModelCatalogParserService: AiModelCatalogParserService,
        private readonly subscriptionCatalogParserService: SubscriptionCatalogParserService,
        private readonly aiModelInsertService: AiModelInsertService,
        private readonly aiModelCatalogService: AiModelCatalogService,
        private readonly mountStorageService: MountStorageService,
        private readonly keyStoreService: KeyStoreService,
        private readonly winstonService: WinstonService,
        private readonly seedScopeService: SeedScopeService,
        @Optional()
        private readonly learnerPlanCatalogParserService?: LearnerPlanCatalogParserService,
    ) {}

    /** Upsert the DB model catalog + merge subscription tiers into mount storage. */
    async seed(): Promise<void> {
        const aiModelsEnabled = this.seedScopeService.isAiModelsCatalogSeederEnabled()
        const subscriptionsEnabled = this.seedScopeService.isSubscriptionsCatalogSeederEnabled()
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
            const proSubscription = await this.learnerPlanCatalogParserService?.parseOne()
            if (tiers.length > 0 || proSubscription) {
                const base = getAppConfig()
                if (tiers.length > 0) {
                    base.subscriptions = {
                        tiers,
                    }
                }
                if (proSubscription) {
                    base.proSubscription = proSubscription
                    base.legacySalesMode = proSubscription.enabled
                        ? "pro-only"
                        : base.legacySalesMode
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
