import {
    Module,
} from "@nestjs/common"
import {
    GithubModule,
} from "@modules/github"
import {
    ConfigurableModuleClass,
} from "./my-github-team-status.module-definition"
import {
    MyGithubTeamStatusResolver,
} from "./my-github-team-status.resolver"
import {
    MyGithubTeamStatusService,
} from "./my-github-team-status.service"
import {
    MyGithubTeamStatusHandler,
} from "./my-github-team-status.handler"

@Module({
    imports: [
        GithubModule.register({
            isGlobal: false,
        }),
    ],
    providers: [
        MyGithubTeamStatusResolver,
        MyGithubTeamStatusService,
        MyGithubTeamStatusHandler,
    ],
})
/**
 * Feature-module boundary for `myGithubTeamStatus` -- imports `GithubModule` and
 * wires resolver, service, and handler.
 */
export class MyGithubTeamStatusSingleQueryModule extends ConfigurableModuleClass {}
