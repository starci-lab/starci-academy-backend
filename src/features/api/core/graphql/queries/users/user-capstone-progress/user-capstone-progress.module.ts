import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-capstone-progress.module-definition"
import {
    UserCapstoneProgressResolver,
} from "./user-capstone-progress.resolver"

@Module({
    providers: [
        UserCapstoneProgressResolver,
    ],
})
/** Feature-module boundary for the `userCapstoneProgress` query -- wires its resolver so the users group can mount this profile tab independently. */
export class UserCapstoneProgressSingleQueryModule extends ConfigurableModuleClass {}
