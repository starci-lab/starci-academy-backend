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
/** Feature-module boundary for the `userSolvedChallengeDetail` query — wires its resolver + service. */
export class UserSolvedChallengeDetailSingleQueryModule extends ConfigurableModuleClass {}
