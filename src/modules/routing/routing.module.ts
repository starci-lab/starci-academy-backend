import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./routing.module-definition"
import {
    LabelResolverService,
} from "./label-resolver.service"

/**
 * Module exposing routing helpers that need DI — currently the
 * {@link LabelResolverService} (EntityManager + CacheService).
 */
@Module({
    providers: [
        LabelResolverService,
    ],
    exports: [
        LabelResolverService,
    ],
})
export class RoutingModule extends ConfigurableModuleClass {
}
