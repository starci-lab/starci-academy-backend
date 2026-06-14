import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./draw-interview-card.module-definition"
import {
    DrawInterviewCardResolver,
} from "./draw-interview-card.resolver"

@Module({
    providers: [
        DrawInterviewCardResolver,
    ],
})
export class DrawInterviewCardSingleQueryModule extends ConfigurableModuleClass {}
