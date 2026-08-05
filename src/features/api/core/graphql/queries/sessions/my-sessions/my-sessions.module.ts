import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-sessions.module-definition"
import {
    MySessionsResolver,
} from "./my-sessions.resolver"

@Module({
    providers: [
        MySessionsResolver,
    ],
})
/**
 * Wires the authenticated `mySessions` device list. Resolver-only -- reads
 * the session cookie to flag "this device", then lists owner-scoped rows.
 */
export class MySessionsSingleQueryModule extends ConfigurableModuleClass {}
