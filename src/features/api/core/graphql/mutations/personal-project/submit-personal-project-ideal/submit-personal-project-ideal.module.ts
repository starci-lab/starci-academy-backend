import {
    Module,
} from "@nestjs/common"
import {
    SubmitPersonalProjectIdealResolver,
} from "./submit-personal-project-ideal.resolver"
import {
    SubmitPersonalProjectIdealService,
} from "./submit-personal-project-ideal.service"
import {
    SubmitPersonalProjectIdealHandler,
} from "./submit-personal-project-ideal.handler"
import {
    ConfigurableModuleClass
} from "./submit-personal-project-ideal.module-definition"

@Module({
    providers: [
        SubmitPersonalProjectIdealResolver,
        SubmitPersonalProjectIdealService,
        SubmitPersonalProjectIdealHandler,
    ],
})
export class SubmitPersonalProjectIdealModule extends ConfigurableModuleClass { }
