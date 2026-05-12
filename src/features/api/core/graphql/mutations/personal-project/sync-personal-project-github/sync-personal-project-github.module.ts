import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./sync-personal-project-github.module-definition"
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
        SyncPersonalProjectGithubResolver,
        SyncPersonalProjectGithubService,
        SyncPersonalProjectGithubHandler,
    ],
})
export class SyncPersonalProjectGithubModule extends ConfigurableModuleClass {}
