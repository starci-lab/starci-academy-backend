import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./add-to-cart.module-definition"
import {
    AddToCartResolver,
} from "./add-to-cart.resolver"
import {
    AddToCartService,
} from "./add-to-cart.service"
import {
    AddToCartHandler,
} from "./add-to-cart.handler"

@Module({
    providers: [
        AddToCartService,
        AddToCartResolver,
        AddToCartHandler,
    ],
})
export class AddToCartSingleMutationModule extends ConfigurableModuleClass {}
