import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./clear-cart.module-definition"
import {
    ClearCartResolver,
} from "./clear-cart.resolver"
import {
    ClearCartService,
} from "./clear-cart.service"
import {
    ClearCartHandler,
} from "./clear-cart.handler"

@Module({
    providers: [
        ClearCartService,
        ClearCartResolver,
        ClearCartHandler,
    ],
})
export class ClearCartSingleMutationModule extends ConfigurableModuleClass {}
