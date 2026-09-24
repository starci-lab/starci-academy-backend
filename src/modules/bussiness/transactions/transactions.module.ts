import {
    DynamicModule,
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./transactions.module-definition"
import {
    TransactionActionService,
} from "./atomic/transaction-action.service"
import {
    TransactionReconcileQueryService,
} from "./atomic/transaction-reconcile-query.service"
import {
    CheckoutGatewayService,
} from "./atomic/checkout-gateway.service"
import {
    TransactionGrantService,
} from "./atomic/transaction-grant.service"
import {
    ProSubscriptionModule,
} from "../pro-subscription/pro-subscription.module"

@Module({
    imports: [
        ProSubscriptionModule,
    ],
})
/**
 * Module for transaction management.
 */
export class TransactionsModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        return {
            ...dynamicModule,
            providers: [
                ...(dynamicModule.providers ?? []),
                TransactionActionService,
                TransactionReconcileQueryService,
                CheckoutGatewayService,
                TransactionGrantService,
            ],
            exports: [
                TransactionActionService,
                TransactionReconcileQueryService,
                CheckoutGatewayService,
                TransactionGrantService,
            ],
        }
    }
}
