import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-capstone-tasks.module-definition"
import {
    UserCapstoneTasksResolver,
} from "./user-capstone-tasks.resolver"

@Module({
    providers: [
        UserCapstoneTasksResolver,
    ],
})
/** Feature-module boundary for the `userCapstoneTasks` query — wires its resolver so the users group can mount this profile tab independently. */
export class UserCapstoneTasksSingleQueryModule extends ConfigurableModuleClass {}
