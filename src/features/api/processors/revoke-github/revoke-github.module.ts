import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./revoke-github.module-definition"
import {
    RevokeGithubWorker,
} from "./revoke-github.worker"
import {
    RevokeGithubStepMappingService,
} from "./step-mapping.service"
import {
    ProcessRevokeGithubRemoveStepService,
} from "./steps/process-revoke-github-remove-step.service"

@Module({
    providers: [
        ProcessRevokeGithubRemoveStepService,
        RevokeGithubStepMappingService,
        RevokeGithubWorker,
    ],
})
/**
 * Module for revoke-github queue processor.
 */
export class RevokeGithubModule extends ConfigurableModuleClass {}
