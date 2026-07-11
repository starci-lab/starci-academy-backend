import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./playground-sessions.module-definition"
import {
    CreatePlaygroundSessionSingleMutationModule,
} from "./create-playground-session"

@Module({
    imports: [
        CreatePlaygroundSessionSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class PlaygroundSessionsMutationsModule extends ConfigurableModuleClass {}
