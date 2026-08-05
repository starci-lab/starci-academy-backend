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
/** Isolated Nest registration for staging a course in the cart before checkout. */
export class AddToCartSingleMutationModule extends ConfigurableModuleClass {}
