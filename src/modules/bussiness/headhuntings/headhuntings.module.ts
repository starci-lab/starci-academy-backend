import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./headhuntings.module-definition"
import {
    ConsultantContactGateService,
} from "./consultant-contact-gate.service"
import {
    CvVerificationService,
} from "./cv-verification.service"

/**
 * Module for headhunting business logic — the CV-score gate on consultant
 * contact details, plus the CV verification tier (recruiter trust signal).
 */
@Module({
    providers: [
        ConsultantContactGateService,
        CvVerificationService,
    ],
    exports: [
        ConsultantContactGateService,
        CvVerificationService,
    ],
})
export class HeadhuntingsBussinessModule extends ConfigurableModuleClass {
}
