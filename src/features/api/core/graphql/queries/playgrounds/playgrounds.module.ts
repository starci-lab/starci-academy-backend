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
/**
 * Playground query group (course playground list + single-playground detail).
 */
export class PlaygroundsQueriesModule extends ConfigurableModuleClass {}
