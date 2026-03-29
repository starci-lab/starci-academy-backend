import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./me.module-definition"
import {
    MeResolver,
} from "./me.resolver"
import {
    MeService,
} from "./me.service"

@Module({
    providers: [
        MeService,
        MeResolver,
    ],
})
export class MeSingleQueryModule extends ConfigurableModuleClass {}
