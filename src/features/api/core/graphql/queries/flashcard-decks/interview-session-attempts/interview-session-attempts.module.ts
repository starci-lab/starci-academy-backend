import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./interview-session-attempts.module-definition"
import {
    InterviewSessionAttemptsResolver,
} from "./interview-session-attempts.resolver"

@Module({
    providers: [
        InterviewSessionAttemptsResolver,
    ],
})
export class InterviewSessionAttemptsSingleQueryModule extends ConfigurableModuleClass {}
