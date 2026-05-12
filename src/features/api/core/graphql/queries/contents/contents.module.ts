import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./contents.module-definition"
import {
    ContentsSingleQueryModule,
} from "./contents"
import {
    ContentSingleQueryModule,
} from "./content"
import {
    ContentStatusSingleQueryModule,
} from "./content-status"
import {
    PublicContentSingleQueryModule,
} from "./public-content"
import {
    SavedContentsSingleQueryModule,
} from "./saved-contents"

@Module({
    imports: [
        ContentsSingleQueryModule.register({
            isGlobal: true,
        }),
        ContentSingleQueryModule.register({
            isGlobal: true,
        }),
        ContentStatusSingleQueryModule.register({
            isGlobal: true,
        }),
        PublicContentSingleQueryModule.register({
            isGlobal: true,
        }),
        SavedContentsSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class ContentsModule extends ConfigurableModuleClass {}
