import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./job-readiness.module-definition"
import {
    MyJobReadinessResolver,
} from "./my-job-readiness.resolver"
import {
    UserJobReadinessResolver,
} from "./user-job-readiness.resolver"
import {
    JobReadinessService,
} from "./job-readiness.service"

@Module({
    providers: [
        MyJobReadinessResolver,
        UserJobReadinessResolver,
        JobReadinessService,
    ],
})
/**
 * Job-readiness query group -- the self view (`myJobReadiness`) and the public
 * recruiter view (`userJobReadiness`), both backed by one
 * {@link JobReadinessService}.
 */
export class JobReadinessQueriesModule extends ConfigurableModuleClass {}
