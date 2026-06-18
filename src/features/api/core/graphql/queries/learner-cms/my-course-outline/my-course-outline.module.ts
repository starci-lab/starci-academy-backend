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
export class MyCourseOutlineSingleQueryModule extends ConfigurableModuleClass {}
