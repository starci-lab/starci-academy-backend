import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./repo-synchronizer.module-definition"
import {
    RepoSynchronizerService,
} from "./repo-synchronizer.service"

@Module({
    providers: [
        RepoSynchronizerService,
    ],
    exports: [
        RepoSynchronizerService,
    ],
})
/**
 * Module for synchronizing `.repo/` sandbox code to CDN.
 */
export class RepoSynchronizerModule extends ConfigurableModuleClass { }
