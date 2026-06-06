import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./useform.module-definition"
import {
    StoreModule,
} from "../../store"
import {
    UseFormController,
} from "./useform.controller"

/** Leaf module for the useForm-and-zod-resolver lesson mock. */
@Module({
    imports: [StoreModule],
    controllers: [UseFormController],
})
export class UseFormModule extends ConfigurableModuleClass {}
