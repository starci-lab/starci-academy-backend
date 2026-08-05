import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./ai-subscription-tiers.module-definition"
import {
    AiSubscriptionTiersResolver,
} from "./ai-subscription-tiers.resolver"

@Module({
    providers: [
        AiSubscriptionTiersResolver,
    ],
})
/** Feature-module boundary for the `aiSubscriptionTiers` query — wires its resolver so the AI group can mount this read independently. */
export class AiSubscriptionTiersSingleQueryModule extends ConfigurableModuleClass {}
