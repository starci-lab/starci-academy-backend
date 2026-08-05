import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./usequery.module-definition"
import {
    StoreModule,
} from "../../store/store.module"
import {
    UseQueryController,
} from "./usequery.controller"

@Module({
    imports: [StoreModule],
    controllers: [UseQueryController],
})
/** Leaf module for the useQuery cache-lifecycle lesson mock. */
export class UseQueryModule extends ConfigurableModuleClass {}
