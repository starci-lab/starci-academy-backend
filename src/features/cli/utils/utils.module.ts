
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
    PlaygroundSeedCommand,
} from "./subs"

@Module({
    providers: [
        UtilsCommand,
        PgSyncCommand,
        PlaygroundSeedCommand,
    ],
})
export class UtilsModule extends ConfigurableModuleClass {}
