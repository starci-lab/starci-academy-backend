import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    DeleteCvBlocksResolver,
} from "./delete-cv-blocks.resolver"
import {
    DeleteCvBlocksService,
} from "./delete-cv-blocks.service"
import {
    DeleteCvBlocksHandler,
} from "./delete-cv-blocks.handler"
import {
    ConfigurableModuleClass,
} from "./delete-cv-blocks.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        DeleteCvBlocksResolver,
        DeleteCvBlocksService,
        DeleteCvBlocksHandler,
    ],
    exports: [
        DeleteCvBlocksService,
    ],
})
export class DeleteCvBlocksSingleMutationModule extends ConfigurableModuleClass {}
