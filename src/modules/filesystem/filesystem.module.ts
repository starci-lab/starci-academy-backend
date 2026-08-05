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
/**
 * Mount readers + AI quota config so secrets stay on disk (k8s/docker volume)
 * and never ride in process env that leaks into logs or crash dumps.
 */
export class FilesystemModule extends ConfigurableModuleClass {}