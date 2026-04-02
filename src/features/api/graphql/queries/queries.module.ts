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
    ],
})
export class QueriesModule extends ConfigurableModuleClass {}
