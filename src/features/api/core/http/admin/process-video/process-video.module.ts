import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./process-video.module-definition"
import {
    ProcessVideoController,
} from "./process-video.controller"
import {
    ProcessVideoService,
} from "./process-video.service"
import {
    ProcessVideoHandler,
} from "./process-video.handler"

/**
 * Module for admin video processing.
 */
@Module({
    controllers: [
        ProcessVideoController,
    ],
    providers: [
        ProcessVideoService,
        ProcessVideoHandler,
    ],
})
export class ProcessVideoModule extends ConfigurableModuleClass { }
