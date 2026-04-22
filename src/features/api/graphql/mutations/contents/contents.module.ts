import {
    Module,
} from "@nestjs/common"
import {
    MarkAsReadedSingleMutationModule,
} from "./mark-as-readed"
import {
    AddToFavoritesSingleMutationModule,
} from "./add-to-favorites"
import {
    RemoveFromFavoritesSingleMutationModule,
} from "./remove-from-favorites"
import {
    ConfigurableModuleClass 
} from "./contents.module-definition"

@Module({
    imports: [
        MarkAsReadedSingleMutationModule.register({
            isGlobal: true,
        }),
        AddToFavoritesSingleMutationModule.register({
            isGlobal: true,
        }),
        RemoveFromFavoritesSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class ContentsMutationModule extends ConfigurableModuleClass { }
