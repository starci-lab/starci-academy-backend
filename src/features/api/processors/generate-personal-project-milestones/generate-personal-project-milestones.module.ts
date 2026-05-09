import {
    Module,
} from "@nestjs/common"
import {
    GeneratePersonalProjectMilestonesWorker,
} from "./generate-personal-project-milestones.worker"
import {
    ConfigurableModuleClass,
} from "./generate-personal-project-milestones.module-definition"
import {
    GenerateMilestonesStepService,
    GenerateMilestonesCompleteStepService,
} from "./steps"
import {
    GenerateMilestonesStepMappingService,
} from "./step-mapping.service"

@Module({
    providers: [
        GenerateMilestonesStepService,
        GenerateMilestonesCompleteStepService,
        GenerateMilestonesStepMappingService,
        GeneratePersonalProjectMilestonesWorker,
    ],
})
export class GeneratePersonalProjectMilestonesModule extends ConfigurableModuleClass {}
