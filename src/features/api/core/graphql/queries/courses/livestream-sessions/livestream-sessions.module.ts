import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./livestream-sessions.module-definition"
import {
    LivestreamSessionsResolver,
} from "./livestream-sessions.resolver"
import {
    LivestreamSessionsService,
} from "./livestream-sessions.service"
import {
    LivestreamSessionsHandler,
} from "./livestream-sessions.handler"

@Module({
    providers: [
        LivestreamSessionsService,
        LivestreamSessionsResolver,
        LivestreamSessionsHandler,
    ],
})
/** Feature-module boundary for the `livestreamSessions` query. */
export class LivestreamSessionsSingleQueryModule extends ConfigurableModuleClass {}
