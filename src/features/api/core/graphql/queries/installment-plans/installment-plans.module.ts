import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./installment-plans.module-definition"
import {
    MyInstallmentPlansResolver,
} from "./my-installment-plans.resolver"
import {
    MyInstallmentPlansService,
} from "./my-installment-plans.service"

/**
 * Installment-plan query module — the read side of the "Kế hoạch trả góp của
 * tôi" surface (`myInstallmentPlans`). The write side (`payNextInstallment`)
 * lives in the mutations module; the plan lifecycle in `@modules/bussiness`.
 */
@Module({
    providers: [
        MyInstallmentPlansResolver,
        MyInstallmentPlansService,
    ],
})
export class InstallmentPlansQueriesModule extends ConfigurableModuleClass {}
