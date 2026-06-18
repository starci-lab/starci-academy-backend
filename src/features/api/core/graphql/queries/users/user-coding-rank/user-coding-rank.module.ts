import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-coding-rank.module-definition"
import {
    UserCodingRankResolver,
} from "./user-coding-rank.resolver"

@Module({
    providers: [
        UserCodingRankResolver,
    ],
})
export class UserCodingRankSingleQueryModule extends ConfigurableModuleClass {}
