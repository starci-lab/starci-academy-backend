import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    PurchaseAiSubscriptionResolver,
} from "./purchase-ai-subscription.resolver"
import {
    PurchaseAiSubscriptionService,
} from "./purchase-ai-subscription.service"
import {
    PurchaseAiSubscriptionHandler,
} from "./purchase-ai-subscription.handler"
import {
    ConfigurableModuleClass,
} from "./purchase-ai-subscription.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        PurchaseAiSubscriptionResolver,
        PurchaseAiSubscriptionService,
        PurchaseAiSubscriptionHandler,
    ],
    exports: [
        PurchaseAiSubscriptionService,
    ],
})
/**
 * Registers resolver + bus service + checkout handler as one Nest unit so the
 * AI group cannot import a half-wired purchase leaf.
 */
export class PurchaseAiSubscriptionSingleMutationModule extends ConfigurableModuleClass {}
