import {
    ConfigurableModuleClass,
} from "./last-personal-task-attempt.module-definition"
import {
    Module,
} from "@nestjs/common"
import {
    LastPersonalTaskAttemptResolver,
} from "./last-personal-task-attempt.resolver"
import {
    LastPersonalTaskAttemptService,
} from "./last-personal-task-attempt.service"
import {
    LastPersonalTaskAttemptHandler,
} from "./last-personal-task-attempt.handler"

@Module({
    providers: [
        LastPersonalTaskAttemptResolver,
        LastPersonalTaskAttemptService,
        LastPersonalTaskAttemptHandler,
    ],
})
export class LastPersonalTaskAttemptSingleQueryModule extends ConfigurableModuleClass {}
