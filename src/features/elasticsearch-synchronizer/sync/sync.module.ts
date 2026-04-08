import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./sync.module-definition"
import {
    ChallengeFactorySyncService,
    ChallengeRuntimeContextService,
} from "./challenges"

@Module({
    providers: [
        ChallengeFactorySyncService,
        ChallengeRuntimeContextService
    ],
})
export class SyncModule extends ConfigurableModuleClass {}
