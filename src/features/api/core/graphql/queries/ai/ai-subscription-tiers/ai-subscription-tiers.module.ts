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
export class AiSubscriptionTiersSingleQueryModule extends ConfigurableModuleClass {}
