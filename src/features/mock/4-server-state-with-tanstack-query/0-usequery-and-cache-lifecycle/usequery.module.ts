import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./usequery.module-definition"
import {
    StoreModule,
} from "../../store"
import {
    UseQueryController,
} from "./usequery.controller"

/** Leaf module for the useQuery cache-lifecycle lesson mock. */
@Module({
    imports: [StoreModule],
    controllers: [UseQueryController],
})
export class UseQueryModule extends ConfigurableModuleClass {}
