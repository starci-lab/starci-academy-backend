import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    ConfigurableModuleClass,
} from "./my-course-outline.module-definition"
import {
    MyCourseOutlineResolver,
} from "./my-course-outline.resolver"
import {
    MyCourseOutlineService,
} from "./my-course-outline.service"
import {
    MyCourseOutlineHandler,
} from "./my-course-outline.handler"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        MyCourseOutlineResolver,
        MyCourseOutlineService,
        MyCourseOutlineHandler,
    ],
    exports: [
        MyCourseOutlineService,
    ],
})
/**
 * Feature-module boundary for the `myCourseOutline` query -- wires resolver + service +
 * handler, and re-exports the service so sibling learner-cms reads can reuse the outline.
 */
export class MyCourseOutlineSingleQueryModule extends ConfigurableModuleClass {}
