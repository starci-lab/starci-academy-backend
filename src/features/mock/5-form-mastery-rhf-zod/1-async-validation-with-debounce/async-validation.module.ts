import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./async-validation.module-definition"
import {
    StoreModule,
} from "../../store"
import {
    AsyncValidationController,
} from "./async-validation.controller"

@Module({
    imports: [StoreModule],
    controllers: [AsyncValidationController],
})
/** Leaf module for the async-validation-with-debounce lesson mock. */
export class AsyncValidationModule extends ConfigurableModuleClass {}
