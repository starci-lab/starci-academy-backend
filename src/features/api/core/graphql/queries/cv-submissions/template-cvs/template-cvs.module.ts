import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./template-cvs.module-definition"
import {
    TemplateCvsResolver,
} from "./template-cvs.resolver"
import {
    TemplateCvsService,
} from "./template-cvs.service"
import {
    TemplateCvsHandler,
} from "./template-cvs.handler"

@Module({
    providers: [
        TemplateCvsResolver,
        TemplateCvsService,
        TemplateCvsHandler,
    ],
})
/**
 * Wires resolver, service, and handler for `templateCvs` (review rubrics).
 * Register globally from the CV queries aggregator.
 */
export class TemplateCvsSingleQueryModule extends ConfigurableModuleClass {}
