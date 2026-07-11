import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./playgrounds.module-definition"
import {
    PlaygroundsSingleQueryModule,
} from "./playgrounds"
import {
    PlaygroundSingleQueryModule,
} from "./playground"

/**
 * Playground query group (course playground list + single-playground detail).
 */
@Module({
    imports: [
        PlaygroundsSingleQueryModule.register({
            isGlobal: true,
        }),
        PlaygroundSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class PlaygroundsQueriesModule extends ConfigurableModuleClass {}
