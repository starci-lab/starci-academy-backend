import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./unpin-project.module-definition"
import {
    UnpinProjectResolver,
} from "./unpin-project.resolver"

@Module({
    providers: [
        UnpinProjectResolver,
    ],
})
export class UnpinProjectSingleMutationModule extends ConfigurableModuleClass {}
