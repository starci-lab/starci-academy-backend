import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./queries.module-definition"
import {
    AuthenticationQueriesModule,
} from "./authentication"
import {
    CoursesQueriesModule,
} from "./courses"
import {
    ContentsModule,
} from "./contents"
import {
    ChallengesModule,
} from "./challenges"
import {
    LessonVideosModule,
} from "./lesson-videos"
import {
    ModulesModule,
} from "./modules"
import {
    ChallengeSubmissionsModule,
} from "./challenge-submissions"
import {
    CvSubmissionsQueriesModule,
} from "./cv-submissions/cv-submissions.module"
import {
    JobsModule,
} from "./jobs"
import {
    SystemModule,
} from "./system"
import {
    ValidationsModule,
} from "./validations"
import {
    AutocompleteQueriesModule,
} from "./autocomplete"
import {
    MilestonesModule,
} from "./milestones"
import {
    PersonalProjectQueriesModule,
} from "./personal-project"

@Module({
    imports: [
        AuthenticationQueriesModule.register({
            isGlobal: true,
        }),
        CoursesQueriesModule.register({
            isGlobal: true,
        }),
        ContentsModule.register({
            isGlobal: true,
        }),
        ChallengesModule.register({
            isGlobal: true,
        }),
        LessonVideosModule.register({
            isGlobal: true,
        }),
        ModulesModule.register({
            isGlobal: true,
        }),
        ChallengeSubmissionsModule.register({
            isGlobal: true,
        }),
        CvSubmissionsQueriesModule.register({
            isGlobal: true
        }),
        JobsModule.register({
            isGlobal: true,
        }),
        SystemModule.register({
            isGlobal: true,
        }),
        ValidationsModule.register({
            isGlobal: true,
        }),
        AutocompleteQueriesModule.register({
            isGlobal: true,
        }),
        MilestonesModule.register({
            isGlobal: true,
        }),
        PersonalProjectQueriesModule.register({
            isGlobal: true,
        }),
    ],
})
export class QueriesModule extends ConfigurableModuleClass {}
