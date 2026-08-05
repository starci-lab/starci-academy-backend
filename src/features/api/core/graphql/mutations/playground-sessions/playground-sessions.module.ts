import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./playground-sessions.module-definition"
import {
    CreatePlaygroundSessionSingleMutationModule,
} from "./create-playground-session/create-playground-session.module"

@Module({
    imports: [
        CreatePlaygroundSessionSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Playground write-side group. Today only session create -- kept separate
 * so later session writes do not land in the root MutationsModule.
 */
export class PlaygroundSessionsMutationsModule extends ConfigurableModuleClass {}
