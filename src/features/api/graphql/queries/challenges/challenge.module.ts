import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./challenge.module-definition"
import {
    ChallengeResolver,
} from "./challenge.resolver"
import {
    ChallengeQueryService,
} from "./challenge.service"

@Module({
    providers: [
        ChallengeQueryService,
        ChallengeResolver,
    ],
})
export class ChallengeSingleQueryModule extends ConfigurableModuleClass {}
