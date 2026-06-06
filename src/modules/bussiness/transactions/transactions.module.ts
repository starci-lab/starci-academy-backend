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
    TransactionReconcileQueryService,
} from "./atomic"

/**
 * Module for transaction management.
 */
@Module({
})
export class TransactionsModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        return {
            ...dynamicModule,
            providers: [
                ...(dynamicModule.providers ?? []),
                TransactionActionService,
                TransactionReconcileQueryService,
            ],
            exports: [
                TransactionActionService,
                TransactionReconcileQueryService,
            ],
        }
    }
}
