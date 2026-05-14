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
export class SyncPersonalProjectGithubMutationModule {}
