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

@Module({
    providers: [
        ReconcileTransactionWorker,
        ReconcileTransactionBootSweepService,
    ],
})
/**
 * Module registering the reconcile-transaction BullMQ worker + startup catch-up sweep.
 */
export class ReconcileTransactionModule extends ConfigurableModuleClass {
}
