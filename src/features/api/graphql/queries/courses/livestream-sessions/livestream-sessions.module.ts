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

@Module({
    providers: [
        LivestreamSessionsService,
        LivestreamSessionsResolver,
    ],
})
export class LivestreamSessionsSingleQueryModule extends ConfigurableModuleClass {}
