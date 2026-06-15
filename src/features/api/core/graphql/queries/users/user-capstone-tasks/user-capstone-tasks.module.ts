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
export class UserCapstoneTasksSingleQueryModule extends ConfigurableModuleClass {}
