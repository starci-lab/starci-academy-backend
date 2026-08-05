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
} from "@modules/integrations/elasticsearch/elasticsearch.module"

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
/**
 * Feature-module boundary for the `courses` list query -- imports Elasticsearch
 * and wires resolver, CDN field resolver, service, and handler.
 */
export class CoursesSingleQueryModule extends ConfigurableModuleClass {}
