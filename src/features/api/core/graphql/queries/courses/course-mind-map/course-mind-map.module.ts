import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./course-mind-map.module-definition"
import {
    CourseMindMapResolver,
} from "./course-mind-map.resolver"
import {
    CourseMindMapService,
} from "./course-mind-map.service"

@Module({
    providers: [
        CourseMindMapService,
        CourseMindMapResolver,
    ],
})
export class CourseMindMapSingleQueryModule extends ConfigurableModuleClass {}
