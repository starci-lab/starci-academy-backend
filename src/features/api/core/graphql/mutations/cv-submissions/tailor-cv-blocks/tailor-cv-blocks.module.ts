import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    TailorCvBlocksResolver,
} from "./tailor-cv-blocks.resolver"
import {
    TailorCvBlocksService,
} from "./tailor-cv-blocks.service"
import {
    TailorCvBlocksHandler,
} from "./tailor-cv-blocks.handler"
import {
    ConfigurableModuleClass,
} from "./tailor-cv-blocks.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        TailorCvBlocksResolver,
        TailorCvBlocksService,
        TailorCvBlocksHandler,
    ],
    exports: [
        TailorCvBlocksService,
    ],
})
export class TailorCvBlocksSingleMutationModule extends ConfigurableModuleClass {}
