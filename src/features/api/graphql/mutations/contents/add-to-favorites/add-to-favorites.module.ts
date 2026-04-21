import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    AddToFavoritesResolver,
} from "./add-to-favorites.resolver"
import {
    AddToFavoritesService,
} from "./add-to-favorites.service"
import {
    AddToFavoritesHandler,
} from "./add-to-favorites.handler"
import { ConfigurableModuleClass } from "./add-to-favorites.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        AddToFavoritesResolver,
        AddToFavoritesService,
        AddToFavoritesHandler,
    ],
    exports: [
        AddToFavoritesService,
    ],
})
export class AddToFavoritesSingleMutationModule extends ConfigurableModuleClass {}
