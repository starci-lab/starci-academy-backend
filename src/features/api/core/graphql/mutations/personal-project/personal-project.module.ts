import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./personal-project.module-definition"
import {
    SubmitPersonalGithubUrlSingleMutationModule,
} from "./submit-personal-github-url"
import {
    SyncPersonalProjectGithubSingleMutationModule,
} from "./sync-personal-project-github"
import {
    ReviewPersonalProjectTaskSingleMutationModule,
} from "./review-personal-project-task"
import {
    RequestToTeamSingleMutationModule,
} from "./request-to-team"

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
export class PersonalProjectMutationsModule extends ConfigurableModuleClass { }
