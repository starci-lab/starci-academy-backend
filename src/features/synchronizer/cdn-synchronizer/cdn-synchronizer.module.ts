import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./cdn-synchronizer.module-definition"
import {
    ContentCdnSynchronizerService,
} from "./content.service"
import {
    ChallengeCdnSynchronizerService 
} from "./challenge.service"
import {
    CourseCdnSynchronizerService 
} from "./course.service"
import {
    LessonVideoCdnSynchronizerService 
} from "./lesson-video.service"
import {
    ModuleCdnSynchronizerService 
} from "./module.service"
/**
 * Module for synchronizing the CDN.
 */
@Module({
    providers: [
        ContentCdnSynchronizerService,
        ChallengeCdnSynchronizerService,
        CourseCdnSynchronizerService,
        LessonVideoCdnSynchronizerService,
        ModuleCdnSynchronizerService,
    ],
})
export class CdnSynchronizerModule extends ConfigurableModuleClass {}
