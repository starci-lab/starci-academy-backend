import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./courses.module-definition"
import {
    CoursesResolver,
} from "./courses.resolver"
import {
    CoursesService,
} from "./courses.service"
import {
    CourseCdnResolver,
} from "./course-cdn.resolver"
import {
    CoursesHandler,
} from "./courses.handler"
import {
    ElasticsearchModule,
} from "@modules/elasticsearch"

@Module({
    imports: [
        ElasticsearchModule,
    ],
    providers: [
        CoursesService,
        CoursesResolver,
        CourseCdnResolver,
        CoursesHandler,
    ],
})
export class CoursesSingleQueryModule extends ConfigurableModuleClass {}
