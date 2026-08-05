import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./sessions.module-definition"
import {
    MySessionsSingleQueryModule,
} from "./my-sessions/my-sessions.module"

@Module({
    imports: [
        MySessionsSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Account-security query group. Today only `mySessions` -- the logged-in
 * device list that feeds revoke UX. Revoke itself is a mutation.
 */
export class SessionsQueriesModule extends ConfigurableModuleClass {}
