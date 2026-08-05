import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./routing.module-definition"
import {
    LabelResolverService,
} from "./label-resolver.service"

@Module({
    providers: [
        LabelResolverService,
    ],
    exports: [
        LabelResolverService,
    ],
})
/**
 * Module exposing routing helpers that need DI — currently the
 * {@link LabelResolverService} (EntityManager + CacheService).
 */
export class RoutingModule extends ConfigurableModuleClass {
}
