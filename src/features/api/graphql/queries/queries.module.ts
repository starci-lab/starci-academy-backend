import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./queries.module-definition"
import {
    CoursesQueriesModule,
} from "./courses"

@Module({
    imports: [
        CoursesQueriesModule.register({
            isGlobal: true,
        }),
    ],
})
export class QueriesModule extends ConfigurableModuleClass {}
