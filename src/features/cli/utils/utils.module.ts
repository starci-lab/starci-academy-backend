
import {
    Module 
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./utils.module-definition"
import {
    UtilsCommand,
} from "./utils.command"
import {
    PgSyncCommand,
} from "./subs"

@Module({
    providers: [
        UtilsCommand,
        PgSyncCommand,
    ],
})
export class UtilsModule extends ConfigurableModuleClass {}
