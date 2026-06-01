import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./ai.module-definition"
import {
    MyAiQuotaSingleQueryModule,
} from "./my-ai-quota"
import {
    MyAiSettingsSingleQueryModule,
} from "./my-ai-settings"
import {
    AiSubscriptionTiersSingleQueryModule,
} from "./ai-subscription-tiers"
import {
    MyCreditUsageSingleQueryModule,
} from "./my-credit-usage"
import {
    MyCreditUsageHistorySingleQueryModule,
} from "./my-credit-usage-history"

/**
 * Per-user AI query group (quota snapshot, lane settings, tier catalog, …).
 */
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
export class AiQueriesModule extends ConfigurableModuleClass {}
