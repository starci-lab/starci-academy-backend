import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./resolve-route.module-definition"
import {
    ResolveRouteResolver,
} from "./resolve-route.resolver"

@Module({
    providers: [
        ResolveRouteResolver,
    ],
})
export class ResolveRouteSingleQueryModule extends ConfigurableModuleClass {}
