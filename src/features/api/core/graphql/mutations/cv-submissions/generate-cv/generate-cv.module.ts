import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    GenerateCvResolver,
} from "./generate-cv.resolver"
import {
    GenerateCvService,
} from "./generate-cv.service"
import {
    GenerateCvHandler,
} from "./generate-cv.handler"
import {
    ConfigurableModuleClass,
} from "./generate-cv.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        GenerateCvResolver,
        GenerateCvService,
        GenerateCvHandler,
    ],
    exports: [
        GenerateCvService,
    ],
})
/** Isolated Nest registration for generate-cv without wiring upload/revise into the same graph. */
export class GenerateCvSingleMutationModule extends ConfigurableModuleClass {}
