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
export class WeeklyChallengeSingleQueryModule extends ConfigurableModuleClass {}
