import {
    Module,
} from "@nestjs/common"
import {
    PurchaseAiSubscriptionSingleMutationModule,
} from "./purchase-ai-subscription"
import {
    SetAiCeilSingleMutationModule,
} from "./set-ai-ceil"
import {
    ConfigurableModuleClass,
} from "./ai.module-definition"

/**
 * Per-user AI mutation group (subscription purchase, per-surface model ceiling, …).
 */
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
export class AiMutationsModule extends ConfigurableModuleClass { }
