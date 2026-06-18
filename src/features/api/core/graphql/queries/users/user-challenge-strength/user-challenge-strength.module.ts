import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-challenge-strength.module-definition"
import {
    UserChallengeStrengthResolver,
} from "./user-challenge-strength.resolver"

@Module({
    providers: [
        UserChallengeStrengthResolver,
    ],
})
export class UserChallengeStrengthSingleQueryModule extends ConfigurableModuleClass {}
