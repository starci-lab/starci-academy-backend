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
import {
    MeHandler,
} from "./me.handler"

@Module({
    providers: [
        MeService,
        MeResolver,
        MeHandler,
    ],
})
export class MeSingleQueryModule extends ConfigurableModuleClass {}
