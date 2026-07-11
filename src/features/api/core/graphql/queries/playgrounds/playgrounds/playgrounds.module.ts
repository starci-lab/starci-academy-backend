import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./playgrounds.module-definition"
import {
    PlaygroundsResolver,
} from "./playgrounds.resolver"

@Module({
    providers: [
        PlaygroundsResolver,
    ],
})
export class PlaygroundsSingleQueryModule extends ConfigurableModuleClass {}
