import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./elasticsearch-synchronizer.module-definition"
import {
    CourseElasticsearchSynchronizerService,
} from "./course.service"
import {
    ChallengeElasticsearchSynchronizerService,
} from "./challenge.service"
import {
    ContentElasticsearchSynchronizerService,
} from "./content.service"
import {
    LessonVideoElasticsearchSynchronizerService,
} from "./lesson-video.service"
import {
    ModuleElasticsearchSynchronizerService,
} from "./module.service"

@Module({
    providers: [
        CourseElasticsearchSynchronizerService,
        ChallengeElasticsearchSynchronizerService,
        ContentElasticsearchSynchronizerService,
        LessonVideoElasticsearchSynchronizerService,
        ModuleElasticsearchSynchronizerService,
    ],
})
export class ElasticsearchSynchronizerModule extends ConfigurableModuleClass {}

