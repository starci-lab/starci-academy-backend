import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./headhuntings.module-definition"
import {
    ConsultantContactGateService,
} from "./consultant-contact-gate.service"

/**
 * Module for headhunting business logic — currently just the CV-score gate
 * on consultant contact details.
 */
@Module({
    providers: [
        ConsultantContactGateService,
    ],
    exports: [
        ConsultantContactGateService,
    ],
})
export class HeadhuntingsBussinessModule extends ConfigurableModuleClass {
}
