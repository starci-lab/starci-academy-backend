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
import {
    ChallengeHandler,
} from "./challenge.handler"

@Module({
    providers: [
        ChallengeQueryService,
        ChallengeResolver,
        ChallengeHandler,
    ],
})
export class ChallengeSingleQueryModule extends ConfigurableModuleClass {}
