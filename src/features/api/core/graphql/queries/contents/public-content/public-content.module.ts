import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./public-content.module-definition"
import {
    PublicContentResolver,
} from "./public-content.resolver"
import {
    PublicContentService,
} from "./public-content.service"
import {
    PublicContentHandler,
} from "./public-content.handler"

@Module({
    providers: [
        PublicContentService,
        PublicContentResolver,
        PublicContentHandler,
    ],
})
/**
 * Nest DI for `publicContent` — no auth module; free lessons only.
 */
export class PublicContentSingleQueryModule extends ConfigurableModuleClass {}
