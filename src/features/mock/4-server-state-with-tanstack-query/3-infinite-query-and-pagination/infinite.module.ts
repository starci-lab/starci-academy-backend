import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./infinite.module-definition"
import {
    StoreModule,
} from "../../store"
import {
    InfiniteController,
} from "./infinite.controller"

/** Leaf module for the infinite-query-and-pagination lesson mock. */
@Module({
    imports: [StoreModule],
    controllers: [InfiniteController],
})
export class InfiniteModule extends ConfigurableModuleClass {}
