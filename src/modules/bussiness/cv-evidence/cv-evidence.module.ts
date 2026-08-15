import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./cv-evidence.module-definition"
import {
    CvEvidenceService,
} from "./cv-evidence.service"

@Module({
    providers: [
        CvEvidenceService,
    ],
    exports: [
        CvEvidenceService,
    ],
})
/** Business owner for listing and freezing CV-eligible capstone evidence. */
export class CvEvidenceModule extends ConfigurableModuleClass {}
