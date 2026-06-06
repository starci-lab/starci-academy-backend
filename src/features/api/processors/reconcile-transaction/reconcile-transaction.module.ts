import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./reconcile-transaction.module-definition"
import {
    ReconcileTransactionWorker,
} from "./reconcile-transaction.worker"
import {
    ReconcileTransactionBootSweepService,
} from "./reconcile-transaction-boot-sweep.service"

/**
 * Module registering the reconcile-transaction BullMQ worker + startup catch-up sweep.
 */
@Module({
    providers: [
        ReconcileTransactionWorker,
        ReconcileTransactionBootSweepService,
    ],
})
export class ReconcileTransactionModule extends ConfigurableModuleClass {
}
