import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./resolve-github.module-definition"
import {
    ResolveGithubWorker,
} from "./resolve-github.worker"
import {
    ResolveGithubStepMappingService,
} from "./step-mapping.service"
import {
    ProcessResolveGithubCompleteStepService,
} from "./steps/process-resolve-github-complete-step.service"
import {
    ProcessResolveGithubSendStepService,
} from "./steps/process-resolve-github-send-step.service"
import {
    ProcessResolveGithubUpdateUserStepService,
} from "./steps/process-resolve-github-update-user-step.service"

@Module({
    providers: [
        ProcessResolveGithubSendStepService,
        ProcessResolveGithubUpdateUserStepService,
        ProcessResolveGithubCompleteStepService,
        ResolveGithubStepMappingService,
        ResolveGithubWorker,
    ],
})
/**
 * Module for resolve-github queue processor.
 */
export class ResolveGithubModule extends ConfigurableModuleClass {}

