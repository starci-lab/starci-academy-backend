import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./submit-eval-challenge.module-definition"
import {
    SubmitEvalChallengeResolver,
} from "./submit-eval-challenge.resolver"
import {
    SubmitEvalChallengeService,
} from "./submit-eval-challenge.service"

@Module({
    providers: [
        SubmitEvalChallengeResolver,
        SubmitEvalChallengeService,
    ],
})
export class SubmitEvalChallengeSingleMutationModule extends ConfigurableModuleClass {}
