import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./interview-sessions.module-definition"
import {
    InterviewSessionsResolver,
} from "./interview-sessions.resolver"

@Module({
    providers: [
        InterviewSessionsResolver,
    ],
})
export class InterviewSessionsSingleQueryModule extends ConfigurableModuleClass {}
