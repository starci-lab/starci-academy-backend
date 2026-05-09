import {
    Module,
} from "@nestjs/common"
import {
    ProcessPersonalProjectWorker,
} from "./process-personal-project.worker"
import {
    ConfigurableModuleClass,
} from "./process-personal-project.module-definition"
import {
    ProcessPersonalProjectGradeStepService,
    ProcessPersonalProjectCompleteStepService,
} from "./steps"
import {
    ProcessPersonalProjectStepMappingService,
} from "./step-mapping.service"

@Module({
    providers: [
        ProcessPersonalProjectGradeStepService,
        ProcessPersonalProjectCompleteStepService,
        ProcessPersonalProjectStepMappingService,
        ProcessPersonalProjectWorker,
    ],
})
export class ProcessPersonalProjectModule extends ConfigurableModuleClass {}
