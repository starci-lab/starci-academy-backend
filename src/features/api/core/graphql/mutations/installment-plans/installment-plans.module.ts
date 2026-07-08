import {
    Module,
} from "@nestjs/common"
import {
    PayNextInstallmentSingleMutationModule,
} from "./pay-next-installment"
import {
    ConfigurableModuleClass,
} from "./installment-plans.module-definition"

/**
 * Installment (trả góp) mutation group — paying an existing plan's current cycle.
 * Creating a plan happens on the checkout side (course/membership purchase
 * with an installment option) and the daily enforcement cron (remind/lock);
 * this group only covers "pay next installment".
 */
@Module({
    imports: [
        PayNextInstallmentSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class InstallmentPlansMutationsModule extends ConfigurableModuleClass { }
