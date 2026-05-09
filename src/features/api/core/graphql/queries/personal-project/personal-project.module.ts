import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./personal-project.module-definition"
import {
    PersonalFeedbacksModule,
} from "./personal-feedbacks"

@Module({
    imports: [
        PersonalFeedbacksModule,
    ],
})
export class PersonalProjectQueriesModule extends ConfigurableModuleClass {}
