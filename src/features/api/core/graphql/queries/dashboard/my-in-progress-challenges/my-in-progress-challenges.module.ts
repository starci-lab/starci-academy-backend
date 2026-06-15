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
export class MyInProgressChallengesSingleQueryModule extends ConfigurableModuleClass {}
