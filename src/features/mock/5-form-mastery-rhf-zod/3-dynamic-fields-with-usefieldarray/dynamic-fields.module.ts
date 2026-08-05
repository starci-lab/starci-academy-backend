import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./dynamic-fields.module-definition"
import {
    StoreModule,
} from "../../store/store.module"
import {
    DynamicFieldsController,
} from "./dynamic-fields.controller"

@Module({
    imports: [StoreModule],
    controllers: [DynamicFieldsController],
})
/** Leaf module for the dynamic-fields-with-useFieldArray lesson mock. */
export class DynamicFieldsModule extends ConfigurableModuleClass {}
