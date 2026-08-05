import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./optimistic.module-definition"
import {
    StoreModule,
} from "../../store"
import {
    OptimisticController,
} from "./optimistic.controller"

@Module({
    imports: [StoreModule],
    controllers: [OptimisticController],
})
/** Leaf module for the optimistic-updates-with-rollback lesson mock. */
export class OptimisticModule extends ConfigurableModuleClass {}
