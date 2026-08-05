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
/** Feature-module boundary for the `userChallengeStrength` query -- wires its resolver so the users group can mount this profile tab independently. */
export class UserChallengeStrengthSingleQueryModule extends ConfigurableModuleClass {}
