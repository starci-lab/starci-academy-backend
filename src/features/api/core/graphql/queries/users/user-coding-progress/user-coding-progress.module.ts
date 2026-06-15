import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-coding-progress.module-definition"
import {
    UserCodingProgressResolver,
} from "./user-coding-progress.resolver"

@Module({
    providers: [
        UserCodingProgressResolver,
    ],
})
export class UserCodingProgressSingleQueryModule extends ConfigurableModuleClass {}
