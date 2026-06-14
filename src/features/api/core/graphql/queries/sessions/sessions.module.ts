import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./sessions.module-definition"
import {
    MySessionsSingleQueryModule,
} from "./my-sessions"

@Module({
    imports: [
        MySessionsSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class SessionsQueriesModule extends ConfigurableModuleClass {}
