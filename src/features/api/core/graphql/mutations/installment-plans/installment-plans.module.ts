import {
    Module,
} from "@nestjs/common"
import {
    PayNextInstallmentSingleMutationModule,
} from "./pay-next-installment"
import {
    ConfigurableModuleClass,
} from "./installment-plans.module-definition"

@Module({
    imports: [
        PayNextInstallmentSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Installment mutation group -- paying an existing plan's current cycle.
 * Creating a plan happens on the checkout side (course/membership purchase
 * with an installment option) and the daily enforcement cron (remind/lock);
 * this group only covers "pay next installment".
 */
export class InstallmentPlansMutationsModule extends ConfigurableModuleClass { }
