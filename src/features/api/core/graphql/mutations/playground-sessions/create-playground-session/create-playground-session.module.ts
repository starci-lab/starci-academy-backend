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
export class CreatePlaygroundSessionSingleMutationModule extends ConfigurableModuleClass {}
