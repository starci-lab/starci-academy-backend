import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./playgrounds.module-definition"
import {
    PlaygroundsResolver,
} from "./playgrounds.resolver"

@Module({
    providers: [
        PlaygroundsResolver,
    ],
})
/**
 * Wires the public `playgrounds` course listing. Resolver-only and
 * optionally authenticated — browsing a course page does not require
 * login; starting a session does.
 */
export class PlaygroundsSingleQueryModule extends ConfigurableModuleClass {}
