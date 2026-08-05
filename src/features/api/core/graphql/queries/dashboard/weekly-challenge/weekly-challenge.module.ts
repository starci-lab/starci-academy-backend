import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./weekly-challenge.module-definition"
import {
    WeeklyChallengeResolver,
} from "./weekly-challenge.resolver"

@Module({
    providers: [
        WeeklyChallengeResolver,
    ],
})
/** Feature-module boundary for the `weeklyChallenge` query -- wires its resolver so the dashboard group can mount this widget independently. */
export class WeeklyChallengeSingleQueryModule extends ConfigurableModuleClass {}
