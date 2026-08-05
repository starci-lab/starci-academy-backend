import {
    ConfigurableModuleClass,
} from "./sync-personal-project-github.module-definition"
import {
    Module,
} from "@nestjs/common"
import {
    SyncPersonalProjectGithubResolver,
} from "./sync-personal-project-github.resolver"
import {
    SyncPersonalProjectGithubService,
} from "./sync-personal-project-github.service"
import {
    SyncPersonalProjectGithubHandler,
} from "./sync-personal-project-github.handler"

@Module({
    providers: [
        SyncPersonalProjectGithubService,
        SyncPersonalProjectGithubResolver,
        SyncPersonalProjectGithubHandler,
    ],
})
/**
 * Registers the enrollment GitHub patch leaf separately from first-time
 * submit so token clears cannot hitch a ride on the required-URL mutation.
 */
export class SyncPersonalProjectGithubSingleMutationModule extends ConfigurableModuleClass {}
