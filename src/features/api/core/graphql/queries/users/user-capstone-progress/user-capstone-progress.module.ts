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
export class UserCapstoneProgressSingleQueryModule extends ConfigurableModuleClass {}
