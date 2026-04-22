import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./incomplete-challenge-submission-jobs.module-definition"
import {
    IncompleteChallengeSubmissionJobsResolver,
} from "./incomplete-challenge-submission-jobs.resolver"
import {
    IncompleteChallengeSubmissionJobsService,
} from "./incomplete-challenge-submission-jobs.service"
import {
    IncompleteChallengeSubmissionJobsHandler,
} from "./incomplete-challenge-submission-jobs.handler"

@Module({
    providers: [
        IncompleteChallengeSubmissionJobsService,
        IncompleteChallengeSubmissionJobsResolver,
        IncompleteChallengeSubmissionJobsHandler,
    ],
})
export class IncompleteChallengeSubmissionJobsQueryModule
    extends ConfigurableModuleClass {}
