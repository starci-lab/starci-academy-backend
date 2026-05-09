import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./personal-project.module-definition"
import {
    SubmitPersonalProjectIdealModule,
} from "./submit-personal-project-ideal"
import {
    SubmitPersonalGithubUrlModule,
} from "./submit-personal-github-url"
import {
    ReviewPersonalProjectForTaskModule,
} from "./review-personal-project-for-task"

@Module({
    imports: [
        SubmitPersonalProjectIdealModule.register({
            isGlobal: true
        }),
        SubmitPersonalGithubUrlModule.register({
            isGlobal: true
        }),
        ReviewPersonalProjectForTaskModule.register({
            isGlobal: true
        }),
    ],
})
export class PersonalProjectMutationsModule extends ConfigurableModuleClass { }
