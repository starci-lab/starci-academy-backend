import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    UpdateCvBlocksResolver,
} from "./update-cv-blocks.resolver"
import {
    UpdateCvBlocksService,
} from "./update-cv-blocks.service"
import {
    UpdateCvBlocksHandler,
} from "./update-cv-blocks.handler"
import {
    ConfigurableModuleClass,
} from "./update-cv-blocks.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        UpdateCvBlocksResolver,
        UpdateCvBlocksService,
        UpdateCvBlocksHandler,
    ],
    exports: [
        UpdateCvBlocksService,
    ],
})
/** Isolated Nest registration for update-cv-blocks without wiring create/delete into the same graph. */
export class UpdateCvBlocksSingleMutationModule extends ConfigurableModuleClass {}
