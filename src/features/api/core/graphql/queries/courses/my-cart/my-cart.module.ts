import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-cart.module-definition"
import {
    MyCartResolver,
} from "./my-cart.resolver"
import {
    MyCartService,
} from "./my-cart.service"
import {
    MyCartHandler,
} from "./my-cart.handler"

@Module({
    providers: [
        MyCartService,
        MyCartResolver,
        MyCartHandler,
    ],
})
/** Feature-module boundary for the `myCart` query. */
export class MyCartSingleQueryModule extends ConfigurableModuleClass {}
