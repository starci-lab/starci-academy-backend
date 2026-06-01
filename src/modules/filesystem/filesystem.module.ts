import {
    Module 
} from "@nestjs/common"
import {
    MountFilesystemService 
} from "./mount.service"
import {
    ConfigurableModuleClass 
} from "./filesystem.module-definition"
import {
    MountStorageService 
} from "./mount-storage.service"
import {
    AiAutoQuotaConfigService,
} from "./ai-auto-quota-config.service"

@Module({
    providers: [
        MountFilesystemService,
        MountStorageService,
        AiAutoQuotaConfigService,
    ],
    exports: [
        MountFilesystemService,
        MountStorageService,
        AiAutoQuotaConfigService,
    ],
})
export class FilesystemModule extends ConfigurableModuleClass {}