import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-coding-progress.module-definition"
import {
    MyCodingProgressResolver,
} from "./my-coding-progress.resolver"

/** Wires the `myCodingProgress` query resolver as its own registrable module. */
@Module({
    providers: [
        MyCodingProgressResolver,
    ],
})
export class MyCodingProgressSingleQueryModule extends ConfigurableModuleClass {}
