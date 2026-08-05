import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./search-course-content.module-definition"
import {
    SearchCourseContentResolver,
} from "./search-course-content.resolver"
import {
    SearchCourseContentService,
} from "./search-course-content.service"

@Module({
    providers: [
        SearchCourseContentResolver,
        SearchCourseContentService,
    ],
})
/**
 * "Tìm nội dung khóa" query module — RAG search over a course's content,
 * powering the ContentAiChat panel's search view.
 */
export class SearchCourseContentQueriesModule extends ConfigurableModuleClass {}
