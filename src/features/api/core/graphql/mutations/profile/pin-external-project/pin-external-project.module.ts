import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./pin-external-project.module-definition"
import {
    PinExternalProjectResolver,
} from "./pin-external-project.resolver"

@Module({
    providers: [
        PinExternalProjectResolver,
    ],
})
export class PinExternalProjectSingleMutationModule extends ConfigurableModuleClass {}
