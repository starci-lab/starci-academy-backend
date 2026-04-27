import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./jobs.module-definition"
import {
    IncompleteChallengeSubmissionJobsQueryModule,
} from "./incomplete-challenge-submission-jobs"

@Module({
    imports: [
        IncompleteChallengeSubmissionJobsQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class JobsModule extends ConfigurableModuleClass {}
