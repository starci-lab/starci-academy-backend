import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./course.module-definition"
import {
    CourseResolver,
} from "./course.resolver"
import {
    CourseService,
} from "./course.service"
import {
    CourseTransformerService,
} from "../../../utils"

@Module({
    providers: [
        CourseService,
        CourseTransformerService,
        CourseResolver,
    ],
})
export class CourseSingleQueryModule extends ConfigurableModuleClass {}
