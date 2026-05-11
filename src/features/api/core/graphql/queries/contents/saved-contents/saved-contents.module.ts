import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./saved-contents.module-definition"
import {
    SavedContentsResolver,
} from "./saved-contents.resolver"
import {
    SavedContentsService,
} from "./saved-contents.service"
import {
    SavedContentsHandler,
} from "./saved-contents.handler"

@Module({
    providers: [
        SavedContentsService,
        SavedContentsResolver,
        SavedContentsHandler,
    ],
})
export class SavedContentsSingleQueryModule extends ConfigurableModuleClass {}
