import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-cv-blocks.module-definition"
import {
    MyCvBlocksResolver,
} from "./my-cv-blocks.resolver"
import {
    MyCvBlocksService,
} from "./my-cv-blocks.service"
import {
    MyCvBlocksHandler,
} from "./my-cv-blocks.handler"

@Module({
    providers: [
        MyCvBlocksResolver,
        MyCvBlocksService,
        MyCvBlocksHandler,
    ],
})
export class MyCvBlocksSingleQueryModule extends ConfigurableModuleClass {}
