import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    SplitCvFromTextResolver,
} from "./split-cv-from-text.resolver"
import {
    SplitCvFromTextService,
} from "./split-cv-from-text.service"
import {
    SplitCvFromTextHandler,
} from "./split-cv-from-text.handler"
import {
    ConfigurableModuleClass,
} from "./split-cv-from-text.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        SplitCvFromTextResolver,
        SplitCvFromTextService,
        SplitCvFromTextHandler,
    ],
    exports: [
        SplitCvFromTextService,
    ],
})
/** Isolated Nest registration for split-from-text without wiring persist mutations into the same graph. */
export class SplitCvFromTextSingleMutationModule extends ConfigurableModuleClass {}
