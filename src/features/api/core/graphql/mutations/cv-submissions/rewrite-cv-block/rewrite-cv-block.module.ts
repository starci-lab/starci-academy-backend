import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    RewriteCvBlockResolver,
} from "./rewrite-cv-block.resolver"
import {
    RewriteCvBlockService,
} from "./rewrite-cv-block.service"
import {
    RewriteCvBlockHandler,
} from "./rewrite-cv-block.handler"
import {
    ConfigurableModuleClass,
} from "./rewrite-cv-block.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        RewriteCvBlockResolver,
        RewriteCvBlockService,
        RewriteCvBlockHandler,
    ],
    exports: [
        RewriteCvBlockService,
    ],
})
/** Isolated Nest registration for single-block rewrite without wiring persist/export into the same graph. */
export class RewriteCvBlockSingleMutationModule extends ConfigurableModuleClass {}
