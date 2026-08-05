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
/** Feature-module boundary for the `userSolvedChallenges` query — wires its resolver so the users group can mount this profile tab independently. */
export class UserSolvedChallengesSingleQueryModule extends ConfigurableModuleClass {}
