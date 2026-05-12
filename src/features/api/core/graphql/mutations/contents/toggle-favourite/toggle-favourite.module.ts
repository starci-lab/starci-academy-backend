import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    ToggleFavouriteResolver,
} from "./toggle-favourite.resolver"
import {
    ToggleFavouriteService,
} from "./toggle-favourite.service"
import {
    ToggleFavouriteHandler,
} from "./toggle-favourite.handler"
import {
    ConfigurableModuleClass 
} from "./toggle-favourite.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        ToggleFavouriteResolver,
        ToggleFavouriteService,
        ToggleFavouriteHandler,
    ],
    exports: [
        ToggleFavouriteService,
    ],
})
export class ToggleFavouriteSingleMutationModule extends ConfigurableModuleClass {}
