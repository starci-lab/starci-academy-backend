import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    PayNextInstallmentResolver,
} from "./pay-next-installment.resolver"
import {
    PayNextInstallmentService,
} from "./pay-next-installment.service"
import {
    PayNextInstallmentHandler,
} from "./pay-next-installment.handler"
import {
    ConfigurableModuleClass,
} from "./pay-next-installment.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        PayNextInstallmentResolver,
        PayNextInstallmentService,
        PayNextInstallmentHandler,
    ],
    exports: [
        PayNextInstallmentService,
    ],
})
export class PayNextInstallmentSingleMutationModule extends ConfigurableModuleClass {}
