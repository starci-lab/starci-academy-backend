import {
    Module,
} from "@nestjs/common"
import {
    MeHandler,
} from "./me.handler"
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
        MeHandler,
    ],
})
export class MeSingleQueryModule extends ConfigurableModuleClass {}
