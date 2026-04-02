import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./proccess-git-url.module-definition"
import {
    ProccessGitUrlStepMappingService,
} from "./step-mapping.service"
import {
    ProccessGitUrlWorker,
} from "./proccess-git-url.worker"
import {
    ProccessGitUrlGradeStepService,
    ProccessGitUrlLoadDocsStepService,
    ProccessGitUrlResolveContextStepService,
    ProccessGitUrlSplitDocsStepService,
    ProccessGitUrlVectorizeStepService,
} from "./steps"

/**
 * Module for the process-git-url BullMQ worker (resolve → load → split → vectorize → grade).
 */
@Module({
    providers: [
        ProccessGitUrlWorker,
        ProccessGitUrlStepMappingService,
        ProccessGitUrlResolveContextStepService,
        ProccessGitUrlLoadDocsStepService,
        ProccessGitUrlSplitDocsStepService,
        ProccessGitUrlVectorizeStepService,
        ProccessGitUrlGradeStepService,
    ],
})
export class ProccessGitUrlModule extends ConfigurableModuleClass {}
