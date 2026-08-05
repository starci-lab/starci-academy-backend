import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-milestone-task-attempts.module-definition"
import {
    MyMilestoneTaskAttemptsResolver,
} from "./my-milestone-task-attempts.resolver"

@Module({
    providers: [
        MyMilestoneTaskAttemptsResolver,
    ],
})
/** Feature-module boundary for the `myMilestoneTaskAttempts` query -- wires its resolver. */
export class MyMilestoneTaskAttemptsSingleQueryModule extends ConfigurableModuleClass {}
