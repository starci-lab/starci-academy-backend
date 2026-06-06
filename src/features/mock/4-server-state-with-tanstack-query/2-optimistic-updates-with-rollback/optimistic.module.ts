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

/** Leaf module for the optimistic-updates-with-rollback lesson mock. */
@Module({
    imports: [StoreModule],
    controllers: [OptimisticController],
})
export class OptimisticModule extends ConfigurableModuleClass {}
