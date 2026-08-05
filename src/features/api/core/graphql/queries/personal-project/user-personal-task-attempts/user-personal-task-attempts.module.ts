import {
    ConfigurableModuleClass,
} from "./user-personal-task-attempts.module-definition"
import {
    Module,
} from "@nestjs/common"
import {
    UserPersonalTaskAttemptsResolver,
} from "./user-personal-task-attempts.resolver"
import {
    UserPersonalTaskAttemptsService,
} from "./user-personal-task-attempts.service"
import {
    UserPersonalTaskAttemptsHandler,
} from "./user-personal-task-attempts.handler"

@Module({
    providers: [
        UserPersonalTaskAttemptsResolver,
        UserPersonalTaskAttemptsService,
        UserPersonalTaskAttemptsHandler,
    ],
})
/**
 * Nest DI for `userPersonalTaskAttempts` -- attempt history for one task.
 */
export class UserPersonalTaskAttemptsSingleQueryModule extends ConfigurableModuleClass {}
