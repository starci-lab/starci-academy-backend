import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./sync.module-definition"
import {
    CoursesSyncService,
} from "./courses.service"

@Module({
    providers: [
        CoursesSyncService,
    ],
})
export class SyncModule extends ConfigurableModuleClass {}

