import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-solved-challenge-detail.module-definition"
import {
    UserSolvedChallengeDetailResolver,
} from "./user-solved-challenge-detail.resolver"
import {
    UserSolvedChallengeDetailService,
} from "./user-solved-challenge-detail.service"

@Module({
    providers: [
        UserSolvedChallengeDetailService,
        UserSolvedChallengeDetailResolver,
    ],
})
export class UserSolvedChallengeDetailSingleQueryModule extends ConfigurableModuleClass {}
