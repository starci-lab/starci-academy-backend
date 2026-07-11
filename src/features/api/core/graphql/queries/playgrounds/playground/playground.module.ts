import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./playground.module-definition"
import {
    PlaygroundResolver,
} from "./playground.resolver"

@Module({
    providers: [
        PlaygroundResolver,
    ],
})
export class PlaygroundSingleQueryModule extends ConfigurableModuleClass {}
