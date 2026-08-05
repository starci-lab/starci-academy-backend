import {
    Module,
} from "@nestjs/common"
import {
    PurchaseAiSubscriptionSingleMutationModule,
} from "./purchase-ai-subscription/purchase-ai-subscription.module"
import {
    SetAiCeilSingleMutationModule,
} from "./set-ai-ceil/set-ai-ceil.module"
import {
    ConfigurableModuleClass,
} from "./ai.module-definition"

@Module({
    imports: [
        PurchaseAiSubscriptionSingleMutationModule.register({
            isGlobal: true,
        }),
        SetAiCeilSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Per-user AI mutation group (subscription purchase, per-surface model ceiling, ...).
 */
export class AiMutationsModule extends ConfigurableModuleClass { }
