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
/**
 * Feature-module boundary for the `resolveRoute` query -- wires its resolver
 * (route building runs inline against the parent-index cache).
 */
export class ResolveRouteSingleQueryModule extends ConfigurableModuleClass {}
