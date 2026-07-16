import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-coding-problem-detail.module-definition"
import {
    UserCodingProblemDetailResolver,
} from "./user-coding-problem-detail.resolver"
import {
    UserCodingProblemDetailService,
} from "./user-coding-problem-detail.service"

@Module({
    providers: [
        UserCodingProblemDetailService,
        UserCodingProblemDetailResolver,
    ],
})
export class UserCodingProblemDetailSingleQueryModule extends ConfigurableModuleClass {}
