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
    ProcessResolveGithubSendStepService,
    ProcessResolveGithubUpdateUserStepService,
} from "./steps"

/**
 * Module for resolve-github queue processor.
 */
@Module({
    providers: [
        ProcessResolveGithubSendStepService,
        ProcessResolveGithubUpdateUserStepService,
        ProcessResolveGithubCompleteStepService,
        ResolveGithubStepMappingService,
        ResolveGithubWorker,
    ],
})
export class ResolveGithubModule extends ConfigurableModuleClass {}

