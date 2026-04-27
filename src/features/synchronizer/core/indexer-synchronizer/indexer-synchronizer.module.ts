import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./indexer-synchronizer.module-definition"
import {
    CourseIndexerSynchronizerService,
} from "./course.service"
import {
    ChallengeIndexerSynchronizerService,
} from "./challenge.service"
import {
    ContentIndexerSynchronizerService,
} from "./content.service"
import {
    LessonVideoIndexerSynchronizerService,
} from "./lesson-video.service"
import {
    ModuleIndexerSynchronizerService,
} from "./module.service"

@Module({
    providers: [
        CourseIndexerSynchronizerService,
        ChallengeIndexerSynchronizerService,
        ContentIndexerSynchronizerService,
        LessonVideoIndexerSynchronizerService,
        ModuleIndexerSynchronizerService,
    ],
})
export class IndexerSynchronizerModule extends ConfigurableModuleClass {}

