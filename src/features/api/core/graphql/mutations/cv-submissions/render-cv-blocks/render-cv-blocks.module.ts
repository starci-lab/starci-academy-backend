import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    RenderCvBlocksResolver,
} from "./render-cv-blocks.resolver"
import {
    RenderCvBlocksService,
} from "./render-cv-blocks.service"
import {
    RenderCvBlocksHandler,
} from "./render-cv-blocks.handler"
import {
    ConfigurableModuleClass,
} from "./render-cv-blocks.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        RenderCvBlocksResolver,
        RenderCvBlocksService,
        RenderCvBlocksHandler,
    ],
    exports: [
        RenderCvBlocksService,
    ],
})
export class RenderCvBlocksSingleMutationModule extends ConfigurableModuleClass {}
