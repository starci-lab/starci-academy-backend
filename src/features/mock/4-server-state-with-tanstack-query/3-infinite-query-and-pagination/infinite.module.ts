import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./infinite.module-definition"
import {
    StoreModule,
} from "../../store/store.module"
import {
    InfiniteController,
} from "./infinite.controller"

@Module({
    imports: [StoreModule],
    controllers: [InfiniteController],
})
/** Leaf module for the infinite-query-and-pagination lesson mock. */
export class InfiniteModule extends ConfigurableModuleClass {}
