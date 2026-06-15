import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-solved-challenges.module-definition"
import {
    UserSolvedChallengesResolver,
} from "./user-solved-challenges.resolver"

@Module({
    providers: [
        UserSolvedChallengesResolver,
    ],
})
export class UserSolvedChallengesSingleQueryModule extends ConfigurableModuleClass {}
