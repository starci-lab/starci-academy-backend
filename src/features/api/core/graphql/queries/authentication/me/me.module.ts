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
/**
 * Wires the authenticated `me` query (resolver + QueryBus service +
 * handler). Registered global from {@link AuthenticationQueriesModule}.
 */
export class MeSingleQueryModule extends ConfigurableModuleClass {}
