import {
    Module 
} from "@nestjs/common"
import {
    TranslationResolverService 
} from "./translation.service"
import {
    ConfigurableModuleClass 
} from "./resolvers.module-definition"
/**
 * The module for the Resolvers.
 */
@Module({
    providers: [
        TranslationResolverService,
    ],
    exports: [
        TranslationResolverService,
    ]
})
export class ResolversModule extends ConfigurableModuleClass {
}