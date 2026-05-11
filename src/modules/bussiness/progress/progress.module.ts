import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass 
} from "./progress.module-definition"
import {
    PersonalProjectProgressService,
} from "./personal-project.service"
import {
    ChallengeProgressService,
} from "./challenge.service"

/**
 * Module for progress business logic.
 */
@Module({
    providers: [
        PersonalProjectProgressService,
        ChallengeProgressService,
    ],
    exports: [
        PersonalProjectProgressService,
        ChallengeProgressService,
    ],
})
export class ProgressModule extends ConfigurableModuleClass {
}
