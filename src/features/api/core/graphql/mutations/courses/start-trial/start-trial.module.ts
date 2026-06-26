import {
    ConfigurableModuleClass,
} from "./start-trial.module-definition"
import {
    Module,
} from "@nestjs/common"
import {
    StartTrialResolver,
} from "./start-trial.resolver"
import {
    StartTrialService,
} from "./start-trial.service"
import {
    StartTrialHandler,
} from "./start-trial.handler"

@Module({
    providers: [
        StartTrialService,
        StartTrialResolver,
        StartTrialHandler,
    ],
})
export class StartTrialSingleMutationModule extends ConfigurableModuleClass {}
