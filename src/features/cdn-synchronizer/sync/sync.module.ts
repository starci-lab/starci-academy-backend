import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./sync.module-definition"
import {
    CoursesSyncService,
} from "./courses.service"
import {
    CoursesSyncV2Service
} from "./courses.v2.service"

@Module({
    providers: [
        // CoursesSyncService,
        CoursesSyncV2Service,
    ],
})
export class SyncModule extends ConfigurableModuleClass {}

