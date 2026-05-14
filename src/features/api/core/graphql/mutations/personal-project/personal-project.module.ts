import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./personal-project.module-definition"
import {
    SubmitPersonalGithubUrlModule,
} from "./submit-personal-github-url"
import {
    SyncPersonalProjectGithubMutationModule,
} from "./sync-personal-project-github"
import {
    ReviewPersonalProjectTaskMutationModule,
} from "./review-personal-project-task"

@Module({
    imports: [
        SubmitPersonalGithubUrlModule.register({
            isGlobal: true
        }),
        SyncPersonalProjectGithubMutationModule,
        ReviewPersonalProjectTaskMutationModule.register({
            isGlobal: true
        }),
    ],
})
export class PersonalProjectMutationsModule extends ConfigurableModuleClass { }
