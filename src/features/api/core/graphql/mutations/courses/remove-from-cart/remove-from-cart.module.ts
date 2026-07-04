import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./remove-from-cart.module-definition"
import {
    RemoveFromCartResolver,
} from "./remove-from-cart.resolver"
import {
    RemoveFromCartService,
} from "./remove-from-cart.service"
import {
    RemoveFromCartHandler,
} from "./remove-from-cart.handler"

@Module({
    providers: [
        RemoveFromCartService,
        RemoveFromCartResolver,
        RemoveFromCartHandler,
    ],
})
export class RemoveFromCartSingleMutationModule extends ConfigurableModuleClass {}
