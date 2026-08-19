import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    ReviseCvResolver,
} from "./revise-cv.resolver"
import {
    ReviseCvService,
} from "./revise-cv.service"
import {
    ReviseCvHandler,
} from "./revise-cv.handler"
import {
    ConfigurableModuleClass,
} from "./revise-cv.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        ReviseCvResolver,
        ReviseCvService,
        ReviseCvHandler,
    ],
    exports: [
        ReviseCvService,
    ],
})
/** Isolated Nest registration for revise-cv without wiring generate/upload into the same graph. */
export class ReviseCvSingleMutationModule extends ConfigurableModuleClass {}
