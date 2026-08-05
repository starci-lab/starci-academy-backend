import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./content-status.module-definition"
import {
    ContentStatusResolver,
} from "./content-status.resolver"
import {
    ContentStatusService,
} from "./content-status.service"
import {
    ContentStatusHandler,
} from "./content-status.handler"

@Module({
    providers: [
        ContentStatusResolver,
        ContentStatusService,
        ContentStatusHandler,
    ],
})
/**
 * Nest DI for `contentStatus` -- wires resolver -> service -> CQRS handler for
 * the caller's read/favorite flags on one lesson.
 */
export class ContentStatusSingleQueryModule extends ConfigurableModuleClass {}
