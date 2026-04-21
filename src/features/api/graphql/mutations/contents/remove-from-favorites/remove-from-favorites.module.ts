import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    RemoveFromFavoritesResolver,
} from "./remove-from-favorites.resolver"
import {
    RemoveFromFavoritesService,
} from "./remove-from-favorites.service"
import {
    RemoveFromFavoritesHandler,
} from "./remove-from-favorites.handler"
import { ConfigurableModuleClass } from "./remove-from-favorites.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        RemoveFromFavoritesResolver,
        RemoveFromFavoritesService,
        RemoveFromFavoritesHandler,
    ],
    exports: [
        RemoveFromFavoritesService,
    ],
})
export class RemoveFromFavoritesSingleMutationModule extends ConfigurableModuleClass {}
