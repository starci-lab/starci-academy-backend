import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./repo-synchronizer.module-definition"
import {
    RepoSynchronizerService,
} from "./repo-synchronizer.service"

/**
 * Module for synchronizing `.repo/` sandbox code to CDN.
 */
@Module({
    providers: [
        RepoSynchronizerService,
    ],
    exports: [
        RepoSynchronizerService,
    ],
})
export class RepoSynchronizerModule extends ConfigurableModuleClass { }
