import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-coding-history.module-definition"
import {
    UserCodingHistoryResolver,
} from "./user-coding-history.resolver"

@Module({
    providers: [
        UserCodingHistoryResolver,
    ],
})
export class UserCodingHistorySingleQueryModule extends ConfigurableModuleClass {}
