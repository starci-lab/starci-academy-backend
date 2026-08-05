import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./mutations.module-definition"
import {
    StoreModule,
} from "../../store/store.module"
import {
    MutationsController,
} from "./mutations.controller"

@Module({
    imports: [StoreModule],
    controllers: [MutationsController],
})
/** Leaf module for the mutations + invalidation-graph lesson mock. */
export class MutationsModule extends ConfigurableModuleClass {}
