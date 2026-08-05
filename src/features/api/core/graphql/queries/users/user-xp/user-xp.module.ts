import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-xp.module-definition"
import {
    UserXpResolver,
} from "./user-xp.resolver"

@Module({
    providers: [
        UserXpResolver,
    ],
})
/** Feature-module boundary for the `userXp` query — wires its resolver so the users group can mount this profile tab independently. */
export class UserXpSingleQueryModule extends ConfigurableModuleClass {}
