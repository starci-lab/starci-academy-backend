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
/**
 * Wires resolver, service, and handler for the `challenge` leaf (S3 JSON +
 * premium lock). Registered globally from {@link ChallengesModule}.
 */
export class ChallengeSingleQueryModule extends ConfigurableModuleClass {}
