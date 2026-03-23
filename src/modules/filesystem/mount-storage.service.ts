import {
    Injectable, OnModuleInit 
} from "@nestjs/common"
import {
    AppConfig
} from "./types"
import {
    MountFilesystemService
} from "./mount.service"
import {
    ReadinessWatcherFactoryService 
} from "@modules/mixin"

@Injectable()
export class MountStorageService implements OnModuleInit {
    public appConfig: AppConfig 
    constructor(
        private readonly mountFilesystemService: MountFilesystemService,
        private readonly readinessWatcherFactoryService: ReadinessWatcherFactoryService,
    ) {}

    onModuleInit() {
        this.readinessWatcherFactoryService.createWatcher(MountStorageService.name)
        // get app config from mount filesystem service
        this.appConfig = this.mountFilesystemService.appConfig()
        // set readiness watcher to true
        this.readinessWatcherFactoryService.setReady(MountStorageService.name)
    }
}