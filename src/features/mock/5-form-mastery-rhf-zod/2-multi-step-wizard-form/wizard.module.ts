import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./wizard.module-definition"
import {
    StoreModule,
} from "../../store"
import {
    WizardController,
} from "./wizard.controller"

@Module({
    imports: [StoreModule],
    controllers: [WizardController],
})
/** Leaf module for the multi-step-wizard-form lesson mock. */
export class WizardModule extends ConfigurableModuleClass {}
