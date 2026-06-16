import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./weekly-challenge.module-definition"
import {
    WeeklyChallengeService,
} from "./weekly-challenge.service"

/**
 * Weekly-challenge business module: a single read-only service that picks the
 * current ISO week's challenge deterministically and reports who passed it this
 * week. Exports the service so the GraphQL `weeklyChallenge` leaf can read it.
 */
@Module({
    providers: [
        WeeklyChallengeService,
    ],
    exports: [
        WeeklyChallengeService,
    ],
})
export class WeeklyChallengeModule extends ConfigurableModuleClass {
}
