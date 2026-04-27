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

@Module({
    imports: [
        ContentsSingleQueryModule.register({
            isGlobal: true,
        }),
        ContentSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class ContentsModule extends ConfigurableModuleClass {}
