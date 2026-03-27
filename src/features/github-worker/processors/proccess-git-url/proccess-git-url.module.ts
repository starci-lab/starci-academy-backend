import {
    Module,
} from "@nestjs/common"
import {
    JobModule,
} from "@modules/job"
import {
    ConfigurableModuleClass,
} from "./proccess-git-url.module-definition"
import {
    ProccessGitUrlWorker,
} from "./proccess-git-url.worker"
import {
    ProccessGitUrlLoadDocsStepService,
} from "./proccess-git-url-load-docs-step.service"
import {
    ProccessGitUrlSplitDocsStepService,
} from "./proccess-git-url-split-docs-step.service"
import {
    ProccessGitUrlVectorizeStepService,
} from "./proccess-git-url-vectorize-step.service"

@Module({
    imports: [
        JobModule.register({
            isGlobal: true,
        }),
    ],
    providers: [
        ProccessGitUrlWorker,
        ProccessGitUrlLoadDocsStepService,
        ProccessGitUrlSplitDocsStepService,
        ProccessGitUrlVectorizeStepService,
    ],
})
export class ProccessGitUrlModule extends ConfigurableModuleClass {}
