import {
    Module,
} from "@nestjs/common"
import {
    MarkAsReadedSingleMutationModule,
} from "./mark-as-readed"
import {
    ToggleFavouriteSingleMutationModule,
} from "./toggle-favourite"
import {
    ConfigurableModuleClass 
} from "./contents.module-definition"

@Module({
    imports: [
        MarkAsReadedSingleMutationModule.register({
            isGlobal: true,
        }),
        ToggleFavouriteSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class ContentsMutationModule extends ConfigurableModuleClass { }
