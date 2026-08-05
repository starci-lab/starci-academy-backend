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

@Module({
    controllers: [
        ProcessVideoController,
    ],
    providers: [
        ProcessVideoService,
        ProcessVideoHandler,
    ],
})
/**
 * Module for admin video processing.
 */
export class ProcessVideoModule extends ConfigurableModuleClass { }
