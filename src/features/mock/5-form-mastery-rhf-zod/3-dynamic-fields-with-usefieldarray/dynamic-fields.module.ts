import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./dynamic-fields.module-definition"
import {
    StoreModule,
} from "../../store"
import {
    DynamicFieldsController,
} from "./dynamic-fields.controller"

/** Leaf module for the dynamic-fields-with-useFieldArray lesson mock. */
@Module({
    imports: [StoreModule],
    controllers: [DynamicFieldsController],
})
export class DynamicFieldsModule extends ConfigurableModuleClass {}
