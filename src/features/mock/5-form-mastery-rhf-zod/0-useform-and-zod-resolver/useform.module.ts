import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./useform.module-definition"
import {
    StoreModule,
} from "../../store/store.module"
import {
    UseFormController,
} from "./useform.controller"

@Module({
    imports: [StoreModule],
    controllers: [UseFormController],
})
/** Leaf module for the useForm-and-zod-resolver lesson mock. */
export class UseFormModule extends ConfigurableModuleClass {}
