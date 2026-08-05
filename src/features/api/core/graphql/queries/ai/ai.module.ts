import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./ai.module-definition"
import {
    MyAiQuotaSingleQueryModule,
} from "./my-ai-quota/my-ai-quota.module"
import {
    MyAiSettingsSingleQueryModule,
} from "./my-ai-settings/my-ai-settings.module"
import {
    AiSubscriptionTiersSingleQueryModule,
} from "./ai-subscription-tiers/ai-subscription-tiers.module"
import {
    MyCreditUsageSingleQueryModule,
} from "./my-credit-usage/my-credit-usage.module"
import {
    MyCreditUsageHistorySingleQueryModule,
} from "./my-credit-usage-history/my-credit-usage-history.module"

@Module({
    imports: [
        MyAiQuotaSingleQueryModule.register({
            isGlobal: true,
        }),
        MyAiSettingsSingleQueryModule.register({
            isGlobal: true,
        }),
        AiSubscriptionTiersSingleQueryModule.register({
            isGlobal: true,
        }),
        MyCreditUsageSingleQueryModule.register({
            isGlobal: true,
        }),
        MyCreditUsageHistorySingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Per-user AI query group (quota snapshot, lane settings, tier catalog, ...).
 */
export class AiQueriesModule extends ConfigurableModuleClass {}
