import {
    ConfigurableModuleClass,
} from "./create-playground-session.module-definition"
import {
    Module,
} from "@nestjs/common"
import {
    CreatePlaygroundSessionResolver,
} from "./create-playground-session.resolver"
import {
    CreatePlaygroundSessionService,
} from "./create-playground-session.service"
import {
    CreatePlaygroundSessionHandler,
} from "./create-playground-session.handler"

@Module({
    providers: [
        CreatePlaygroundSessionService,
        CreatePlaygroundSessionResolver,
        CreatePlaygroundSessionHandler,
    ],
})
/**
 * Registers createPlaygroundSession as one Nest unit so pairing-code mint
 * cannot be imported without its session snapshot handler.
 */
export class CreatePlaygroundSessionSingleMutationModule extends ConfigurableModuleClass {}
