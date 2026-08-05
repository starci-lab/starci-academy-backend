import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-in-progress-challenges.module-definition"
import {
    MyInProgressChallengesResolver,
} from "./my-in-progress-challenges.resolver"

@Module({
    providers: [
        MyInProgressChallengesResolver,
    ],
})
/** Feature-module boundary for the `myInProgressChallenges` query — wires its resolver so the dashboard group can mount this widget independently. */
export class MyInProgressChallengesSingleQueryModule extends ConfigurableModuleClass {}
