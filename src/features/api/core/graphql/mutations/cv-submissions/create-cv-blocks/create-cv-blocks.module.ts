import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    CreateCvBlocksResolver,
} from "./create-cv-blocks.resolver"
import {
    CreateCvBlocksService,
} from "./create-cv-blocks.service"
import {
    CreateCvBlocksHandler,
} from "./create-cv-blocks.handler"
import {
    ConfigurableModuleClass,
} from "./create-cv-blocks.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        CreateCvBlocksResolver,
        CreateCvBlocksService,
        CreateCvBlocksHandler,
    ],
    exports: [
        CreateCvBlocksService,
    ],
})
export class CreateCvBlocksSingleMutationModule extends ConfigurableModuleClass {}
