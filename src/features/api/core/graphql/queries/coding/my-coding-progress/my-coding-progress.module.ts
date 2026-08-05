import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-coding-progress.module-definition"
import {
    MyCodingProgressResolver,
} from "./my-coding-progress.resolver"

@Module({
    providers: [
        MyCodingProgressResolver,
    ],
})
/** Wires the `myCodingProgress` query resolver as its own registrable module. */
export class MyCodingProgressSingleQueryModule extends ConfigurableModuleClass {}
