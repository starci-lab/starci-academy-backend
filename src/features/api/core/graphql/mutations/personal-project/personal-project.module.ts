import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./personal-project.module-definition"
import {
    SubmitPersonalGithubUrlSingleMutationModule,
} from "./submit-personal-github-url/submit-personal-github-url.module"
import {
    SyncPersonalProjectGithubSingleMutationModule,
} from "./sync-personal-project-github/sync-personal-project-github.module"
import {
    ReviewPersonalProjectTaskSingleMutationModule,
} from "./review-personal-project-task/review-personal-project-task.module"
import {
    RequestToTeamSingleMutationModule,
} from "./request-to-team/request-to-team.module"

@Module({
    imports: [
        SubmitPersonalGithubUrlSingleMutationModule.register({
            isGlobal: true
        }),
        RequestToTeamSingleMutationModule.register({
            isGlobal: true,
        }),
        SyncPersonalProjectGithubSingleMutationModule.register({
            isGlobal: true,
        }),
        ReviewPersonalProjectTaskSingleMutationModule.register({
            isGlobal: true
        }),
    ],
})
/**
 * Personal-project write-side group: GitHub URL / branch sync, team invite,
 * and per-task review enqueue -- kept together because they all key off the
 * same enrollment row.
 */
export class PersonalProjectMutationsModule extends ConfigurableModuleClass { }
