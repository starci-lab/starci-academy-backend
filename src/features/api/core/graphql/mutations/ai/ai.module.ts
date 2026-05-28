import {
    Module,
} from "@nestjs/common"
import {
    UpdateMyAiSettingsSingleMutationModule,
} from "./update-my-ai-settings"
import {
    PurchaseAiSubscriptionSingleMutationModule,
} from "./purchase-ai-subscription"
import {
    ConfigurableModuleClass,
} from "./ai.module-definition"

/**
 * Per-user AI mutation group (lane settings + BYOK, subscription purchase, …).
 */
@Module({
    imports: [
        UpdateMyAiSettingsSingleMutationModule.register({
            isGlobal: true,
        }),
        PurchaseAiSubscriptionSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class AiMutationsModule extends ConfigurableModuleClass { }
