import {
    Module,
} from "@nestjs/common"
import {
    SubmissionCompletionNotifierService,
} from "./submission-completion-notifier.service"
import {
    LegacyCreditChargeService,
} from "./legacy-credit-charge.service"

@Module({
    providers: [
        SubmissionCompletionNotifierService,
        LegacyCreditChargeService,
    ],
    exports: [
        SubmissionCompletionNotifierService,
        LegacyCreditChargeService,
    ],
})
/**
 * The two post-commit collaborators {@link AbstractSubmissionCompleteStepService} delegates
 * to: the learner notification side effect and the legacy credit-charge fallback. Imported by
 * both the git-submission and Google-Docs-submission processor modules, which each provide
 * their own `AbstractSubmissionCompleteStepService` subclass.
 */
export class ChallengeSubmissionCompletionModule {}
