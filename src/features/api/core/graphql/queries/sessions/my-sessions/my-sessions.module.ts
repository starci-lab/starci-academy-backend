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
export class MySessionsSingleQueryModule extends ConfigurableModuleClass {}
