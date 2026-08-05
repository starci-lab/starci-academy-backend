import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./playground.module-definition"
import {
    PlaygroundResolver,
} from "./playground.resolver"

@Module({
    providers: [
        PlaygroundResolver,
    ],
})
/**
 * Wires the public `playground` detail query (by slug + ordered steps).
 * Resolver-only -- reads Postgres directly; verify secrets stay off the
 * wire via the response type.
 */
export class PlaygroundSingleQueryModule extends ConfigurableModuleClass {}
