import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./installment-plan.module-definition"
import {
    InstallmentPlanService,
} from "./installment-plan.service"
import {
    InstallmentPlanEnforcementCronService,
} from "./installment-plan-enforcement.cron"

@Module({
    providers: [
        InstallmentPlanService,
        InstallmentPlanEnforcementCronService,
    ],
    exports: [
        InstallmentPlanService,
    ],
})
/**
 * Installment-plan business module: plan lifecycle (create/compute-minimum/
 * record-payment/lock-unlock) plus its daily enforcement cron driver. Exports
 * {@link InstallmentPlanService} so the checkout mutation, the reconcile
 * worker, and the "pay next installment" mutation can all create/advance
 * plans; the cron service stays internal.
 */
export class InstallmentPlanModule extends ConfigurableModuleClass {
}
